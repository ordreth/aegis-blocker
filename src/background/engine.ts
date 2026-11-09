import { dnrFilter } from "@/shared/patterns";
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
        regexFilter: dnrFilter(r),
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

/** `capturing`: also fit for a substitution redirect, which needs more of RE2's small memory budget. */
export async function isRegexSupported(regex: string, capturing = false): Promise<boolean> {
  const res = await chrome.declarativeNetRequest.isRegexSupported({
    regex,
    isCaseSensitive: false,
    requireCapturing: capturing,
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
  const full = buildDnrRules(rules, now, ids, true);
  try {
    return await applyDnr(full);
  } catch (err) {
    console.warn("Aegis: rule update refused, checking the rules one by one", err);
  }
  // A single rule the browser cannot take refuses the whole update. Keep every rule
  // it does accept, with the best redirect each one supports; whatever is left out is
  // still enforced by the tab check.
  const plain = new Map(buildDnrRules(rules, now, ids, false).map((r) => [r.id, r]));
  const kept: DnrRule[] = [];
  for (const r of full) {
    const regex = r.condition.regexFilter ?? "";
    const substitutes = !!r.action.redirect?.regexSubstitution;
    if (await isRegexSupported(regex, substitutes)) kept.push(r);
    else if (substitutes && (await isRegexSupported(regex))) kept.push(plain.get(r.id) as DnrRule);
  }
  try {
    return await applyDnr(kept);
  } catch (err) {
    console.warn("Aegis: substitution redirect refused, using the plain redirect", err);
  }
  await applyDnr(kept.map((r) => plain.get(r.id) as DnrRule));
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

async function syncNow(): Promise<void> {
  try {
    await syncDnr();
  } catch (err) {
    // Storage stays the source of truth: alarms and open tabs are still brought in
    // line, and the next sync tries the browser's rules again.
    console.error("Aegis: could not update the browser's rules", err);
  }
  await scheduleAlarms();
  await sweepTabs();
}

let syncing: Promise<void> = Promise.resolve();

/**
 * Brings the browser's rules, the alarms and the open tabs in line with storage.
 * Runs never overlap: each one replaces the rules it found, so an older run that
 * finished after a newer one would bring back what the newer one removed.
 */
export function syncAll(): Promise<void> {
  const run = syncing.then(syncNow);
  syncing = run.catch(() => undefined);
  return run;
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
