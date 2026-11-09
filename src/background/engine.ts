import { urlSource } from "@/shared/patterns";
import { decide, isRuleActive, nextBoundary } from "@/shared/schedule";
import type { Rule } from "@/shared/types";
import {
  getGuard,
  getLockUntil,
  getRules,
  getSnoozed,
  K,
  writeGuard,
} from "./state";

type DnrRule = chrome.declarativeNetRequest.Rule;

const ALARM_BOUNDARY = "aegis:boundary";
const ALARM_LOCK = "aegis:lock";
const ALARM_SNOOZE = "aegis:snooze";

export const blockedUrl = (n: number, original?: string) =>
  chrome.runtime.getURL("blocked.html") +
  `?r=${n}` +
  (original ? `#${original}` : "");

const appliesToUrl = (r: Rule) =>
  r.kind === "domain" || r.kind === "path" || r.scopes.includes("url");

export function buildDnrRules(
  rules: Rule[],
  now: number,
  snoozed: ReadonlySet<string>,
  substitute: boolean,
): DnrRule[] {
  const at = new Date(now);
  const base = chrome.runtime.getURL("blocked.html");
  return rules
    .filter((r) => !snoozed.has(r.id) && isRuleActive(r, at) && appliesToUrl(r))
    .map((r): DnrRule => {
      const condition: DnrRule["condition"] = {
        regexFilter: urlSource(r),
        isUrlFilterCaseSensitive: false,
        resourceTypes: ["main_frame" as chrome.declarativeNetRequest.ResourceType],
      };
      if (r.mode === "allow") {
        return {
          id: r.n,
          priority: 2,
          action: { type: "allow" as chrome.declarativeNetRequest.RuleActionType },
          condition,
        };
      }
      return {
        id: r.n,
        priority: 1,
        action: {
          type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
          redirect: substitute
            ? { regexSubstitution: `${base}?r=${r.n}#\\0` }
            : { extensionPath: `/blocked.html?r=${r.n}` },
        },
        condition,
      };
    });
}

export async function isRegexSupported(regex: string): Promise<boolean> {
  const res = await chrome.declarativeNetRequest.isRegexSupported({
    regex,
    isCaseSensitive: false,
  });
  return res.isSupported;
}

async function applyDnr(desired: DnrRule[]) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: desired,
  });
}

/** Rebuilds all dynamic rules atomically from the stored rules. */
export async function syncDnr(): Promise<void> {
  const [rules, snoozed] = await Promise.all([getRules(), getSnoozed()]);
  const ids = new Set(Object.keys(snoozed));
  const now = Date.now();
  try {
    await applyDnr(buildDnrRules(rules, now, ids, true));
  } catch (err) {
    console.warn("Aegis: substitution redirect rejected, using plain redirect", err);
    try {
      await applyDnr(buildDnrRules(rules, now, ids, false));
    } catch (err2) {
      // Drop rules the engine refuses one by one so a bad rule never disables the rest.
      console.error("Aegis: bulk rule update failed", err2);
      const good: DnrRule[] = [];
      for (const r of buildDnrRules(rules, now, ids, false)) {
        const re = r.condition.regexFilter;
        if (re && (await isRegexSupported(re))) good.push(r);
      }
      await applyDnr(good);
    }
  }
}

export async function scheduleAlarms(): Promise<void> {
  const [rules, lockUntil, snoozed] = await Promise.all([
    getRules(),
    getLockUntil(),
    getSnoozed(),
  ]);
  const set = async (name: string, when: number | null | undefined) => {
    if (when) await chrome.alarms.create(name, { when: Math.max(when, Date.now() + 1000) });
    else await chrome.alarms.clear(name);
  };
  await set(ALARM_BOUNDARY, nextBoundary(rules, Date.now()));
  await set(ALARM_LOCK, lockUntil);
  const soonest = Object.values(snoozed).sort((a, b) => a - b)[0];
  await set(ALARM_SNOOZE, soonest);
}

export const isAegisAlarm = (name: string) =>
  [ALARM_BOUNDARY, ALARM_LOCK, ALARM_SNOOZE].includes(name);

/** Redirects an http(s) tab to the block page if the current rules say so. */
export async function checkTab(
  tab: Pick<chrome.tabs.Tab, "id" | "url" | "title">,
  rules?: Rule[],
): Promise<void> {
  if (tab.id === undefined || !tab.url || !/^https?:/i.test(tab.url)) return;
  const [all, snoozed] = await Promise.all([rules ?? getRules(), getSnoozed()]);
  const d = decide(all, { url: tab.url, title: tab.title }, Date.now(), new Set(Object.keys(snoozed)));
  if (d.action === "block") {
    try {
      await chrome.tabs.update(tab.id, { url: blockedUrl(d.rule.n, tab.url) });
    } catch {
      /* tab closed meanwhile */
    }
  }
}

export async function sweepTabs(): Promise<void> {
  const [rules, tabs] = await Promise.all([
    getRules(),
    chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }),
  ]);
  await Promise.all(tabs.map((tab) => checkTab(tab, rules)));
}

export async function syncAll(): Promise<void> {
  await syncDnr();
  await scheduleAlarms();
  await sweepTabs();
}

/**
 * While Absolute Mode is active, any change to the rules or to the lock that
 * did not come from the service worker is reverted to the last known-good copy.
 */
export async function enforceGuard(): Promise<boolean> {
  const [guard, rules, lockUntil] = await Promise.all([
    getGuard(),
    getRules(),
    getLockUntil(),
  ]);
  const locked = !!guard?.lockUntil && guard.lockUntil > Date.now();
  if (!guard || !locked) {
    const changed = !!guard && JSON.stringify(guard.rules) !== JSON.stringify(rules);
    await writeGuard(rules, lockUntil);
    return changed;
  }
  if (JSON.stringify(rules) === JSON.stringify(guard.rules) && lockUntil === guard.lockUntil)
    return false;
  // Restore straight into storage: the guard itself must stay untouched.
  await chrome.storage.local.set({
    [K.rules]: guard.rules,
    [K.lock]: { until: guard.lockUntil },
  });
  return true;
}
