import { AegisError, type BlockedInfo, type Request, type ResponseMap, type RulePatch } from "@/shared/messages";
import { dnrFilter, MAX_RULES, normalizeHttpUrl, parseAs, ruleMatches } from "@/shared/patterns";
import {
  exportRules,
  MAX_LOCK_HOURS,
  MIN_LOCK_HOURS,
  parseImport,
  sanitizeBlockPage,
  sanitizeRule,
  sanitizeRules,
  sanitizeSettings,
} from "@/shared/schema";
import { decide } from "@/shared/schedule";
import type { AppState, BlockPageConfig, Rule, RuleInput, Settings } from "@/shared/types";
import * as auth from "./auth";
import { isRegexSupported, syncAll } from "./engine";
import {
  getAuth,
  getBlockPage,
  getLockUntil,
  getRules,
  getSettings,
  getSnoozed,
  nextRuleNumber,
  setBlockPage,
  setLockUntil,
  setRules,
  setSettings,
  setSnoozed,
} from "./state";

type Handler<K extends Request["t"]> = (
  req: Extract<Request, { t: K }>,
) => Promise<ResponseMap[K]>;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

async function assertWritable(): Promise<void> {
  await auth.requireUnlocked();
}

async function validateRule(
  input: unknown,
  rules: Rule[],
  lockedOnlyBlock: boolean,
  stored = false,
): Promise<Rule> {
  if (!isObject(input) || typeof input.pattern !== "string" || typeof input.kind !== "string")
    throw new AegisError("invalid");
  const kind = input.kind as RuleInput["kind"];
  const parsed = parseAs(kind, input.pattern, stored);
  if (!parsed.ok) throw new AegisError(parsed.reason);
  const rule = sanitizeRule({
    ...input,
    kind: parsed.kind,
    pattern: parsed.pattern,
    id: undefined,
    n: await nextRuleNumber(rules),
    createdAt: Date.now(),
  });
  if (!rule) throw new AegisError("invalid");
  if (lockedOnlyBlock && (rule.mode !== "block" || !rule.enabled)) throw new AegisError("locked");
  if (rule.kind === "regex" && !(await isRegexSupported(dnrFilter(rule))))
    throw new AegisError("unsupported_regex");
  return rule;
}

function ensureRoom(rules: Rule[], extra: Rule[]): Rule[] {
  if (rules.length + extra.length > MAX_RULES) throw new AegisError("limit");
  const merged = [...rules, ...extra];
  if (sanitizeRules(merged).length !== merged.length) throw new AegisError("duplicate");
  return merged;
}

const commit = async (rules: Rule[]) => {
  await setRules(rules);
  await syncAll();
};

export const state: Handler<"state"> = async () => {
  const [status, lockUntil, settings, rules, blockPage] = await Promise.all([
    auth.authStatus(),
    getLockUntil(),
    getSettings(),
    getRules(),
    getBlockPage(),
  ]);
  return {
    auth: status,
    lockUntil,
    settings,
    rules: status.unlocked ? rules : null,
    blockPage,
    now: Date.now(),
  } satisfies AppState;
};

async function withAuth<T>(fn: () => Promise<T>): Promise<T> {
  await assertWritable();
  return fn();
}

type Table = { [K in Request["t"]]: Handler<K> };

const table: Table = {
  state,

  "auth.login": (r) => auth.login(r.password),
  "auth.logout": async () => (await auth.logout(), null),
  "auth.setup": (r) => withAuth(() => auth.setup(r.password)),
  "auth.change": (r) =>
    withAuth(async () => (await auth.change(r.current, r.next), null)),
  "auth.disable": (r) =>
    withAuth(async () => (await auth.disable(r.password), null)),
  "auth.recover": async (r) => (await auth.recover(r.code), null),

  "rule.add": (r) =>
    withAuth(async () => {
      const [rules, locked] = await Promise.all([getRules(), getLockUntil()]);
      const rule = await validateRule(r.input, rules, !!locked);
      await commit(ensureRoom(rules, [rule]));
      return rule;
    }),

  "rule.addMany": (r) =>
    withAuth(async () => {
      if (!Array.isArray(r.inputs) || r.inputs.length > MAX_RULES) throw new AegisError("invalid");
      const [rules, locked] = await Promise.all([getRules(), getLockUntil()]);
      let current = rules;
      let added = 0;
      for (const input of r.inputs) {
        try {
          const rule = await validateRule(input, current, !!locked);
          current = ensureRoom(current, [rule]);
          added++;
        } catch (e) {
          if (e instanceof AegisError && e.code === "limit") break;
        }
      }
      if (added) await commit(current);
      return { added, skipped: r.inputs.length - added };
    }),

  "rule.update": (r) =>
    withAuth(async () => {
      const [rules, locked] = await Promise.all([getRules(), getLockUntil()]);
      const old = rules.find((x) => x.id === r.id);
      if (!old) throw new AegisError("not_found");
      const patch: RulePatch = isObject(r.patch) ? r.patch : {};
      if (locked && Object.keys(patch).some((k) => k !== "note")) throw new AegisError("locked");
      const merged = { ...old, ...patch };
      // Without a new pattern the stored one is kept as it is, not read again as typed text.
      const untouched = patch.pattern === undefined && (patch.kind ?? old.kind) === old.kind;
      const rule = await validateRule({ ...merged }, rules.filter((x) => x.id !== r.id), false, untouched);
      const next: Rule = { ...rule, id: old.id, n: old.n, createdAt: old.createdAt };
      const list = rules.map((x) => (x.id === old.id ? next : x));
      if (sanitizeRules(list).length !== list.length) throw new AegisError("duplicate");
      await commit(list);
      return next;
    }),

  "rule.remove": (r) =>
    withAuth(async () => {
      if (await getLockUntil()) throw new AegisError("locked");
      const rules = await getRules();
      if (!rules.some((x) => x.id === r.id)) throw new AegisError("not_found");
      await commit(rules.filter((x) => x.id !== r.id));
      return null;
    }),

  "rules.import": (r) =>
    withAuth(async () => {
      const [rules, locked] = await Promise.all([getRules(), getLockUntil()]);
      if (locked && r.mode === "replace") throw new AegisError("locked");
      const parsed = typeof r.json === "string" ? parseImport(r.json) : null;
      if (!parsed) throw new AegisError("bad_import");
      let skipped = parsed.skipped;
      let current = r.mode === "replace" ? [] : rules;
      let next = await nextRuleNumber(current);
      let added = 0;
      for (const rule of parsed.rules) {
        if (locked && (rule.mode !== "block" || !rule.enabled)) { skipped++; continue; }
        if (rule.kind === "regex" && !(await isRegexSupported(dnrFilter(rule)))) { skipped++; continue; }
        const candidate = { ...rule, n: next };
        if (current.length >= MAX_RULES) { skipped++; continue; }
        const merged = [...current, candidate];
        if (sanitizeRules(merged).length !== merged.length) { skipped++; continue; }
        current = merged;
        next++;
        added++;
      }
      await commit(current);
      return { added, skipped };
    }),

  "rules.export": (_r) => withAuth(async () => exportRules(await getRules())),

  "lock.enable": (r) =>
    withAuth(async () => {
      const settings = await getSettings();
      const hours = Math.min(
        MAX_LOCK_HOURS,
        Math.max(MIN_LOCK_HOURS, Math.round(Number(r.hours ?? settings.lockHours)) || settings.lockHours),
      );
      const current = (await getLockUntil()) ?? 0;
      const until = Math.max(current, Date.now() + hours * 3_600_000);
      await setLockUntil(until);
      // A snooze granted before the lock would keep its rule off inside it.
      await setSnoozed({});
      await syncAll();
      return { until };
    }),

  "settings.set": (r) =>
    withAuth(async (): Promise<Settings> => {
      const [current, locked] = await Promise.all([getSettings(), getLockUntil()]);
      const patch = isObject(r.patch) ? (r.patch as Partial<Settings>) : {};
      if (locked) {
        const touchesLocked =
          (patch.lockHours !== undefined && patch.lockHours !== current.lockHours) ||
          (patch.snooze !== undefined &&
            JSON.stringify(patch.snooze) !== JSON.stringify(current.snooze));
        if (touchesLocked) throw new AegisError("locked");
      }
      const next = sanitizeSettings({
        ...current,
        ...patch,
        snooze: { ...current.snooze, ...(isObject(patch.snooze) ? patch.snooze : {}) },
      });
      await setSettings(next);
      return next;
    }),

  "blockpage.set": (r) =>
    withAuth(async (): Promise<BlockPageConfig> => {
      const config = sanitizeBlockPage(r.config);
      if (config.redirect.enabled) {
        const rules = await getRules();
        const d = decide(rules, { url: config.redirect.url }, Date.now());
        if (d.action === "block") throw new AegisError("redirect_loop");
      }
      await setBlockPage(config);
      return config;
    }),

  "blocked.info": async (r): Promise<BlockedInfo> => {
    const [cfg, rules, settings, lockUntil] = await Promise.all([
      getBlockPage(),
      getRules(),
      getSettings(),
      getLockUntil(),
    ]);
    const rule = rules.find((x) => x.n === Number(r.n));
    return {
      pattern: cfg.showRule && rule ? rule.pattern : null,
      lockUntil,
      snooze: settings.snooze.enabled && !lockUntil && rule ? settings.snooze : null,
    };
  },

  "blocked.snooze": async (r) => {
    const [rules, settings, lockUntil, snoozed] = await Promise.all([
      getRules(),
      getSettings(),
      getLockUntil(),
      getSnoozed(),
    ]);
    if (!settings.snooze.enabled || lockUntil) throw new AegisError("locked");
    const rule = rules.find((x) => x.n === Number(r.n) && x.mode === "block");
    if (!rule) throw new AegisError("not_found");
    // Only the address that this rule actually blocks may be unblocked. The address is
    // compared in the browser's normalised form: `https://a.example\@b.com/` is a.example.
    const url = typeof r.url === "string" ? normalizeHttpUrl(r.url) : null;
    if (!url || !ruleMatches(rule, { url, title: undefined })) throw new AegisError("forbidden");
    snoozed[rule.id] = Date.now() + settings.snooze.minutes * 60_000;
    await setSnoozed(snoozed);
    await syncAll();
    return null;
  },
};

/**
 * Requests are handled one at a time. Every handler reads state, decides and
 * writes back; interleaved, two of them could lose a rule, and a burst of
 * password guesses would all pass the back-off check before the first failure
 * is recorded.
 */
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

export const handlers = Object.fromEntries(
  Object.entries(table).map(([t, handler]) => [
    t,
    (req: never) => exclusive(() => (handler as (r: never) => Promise<unknown>)(req)),
  ]),
) as Table;

export const KNOWN = new Set(Object.keys(handlers));
export const hasAuth = async () => !!(await getAuth());
