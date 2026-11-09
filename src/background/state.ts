import type { PasswordRecord } from "@/shared/crypto";
import {
  DEFAULT_BLOCK_PAGE,
  DEFAULT_SETTINGS,
  sanitizeBlockPage,
  sanitizeRules,
  sanitizeSettings,
  SCHEMA_VERSION,
} from "@/shared/schema";
import type { BlockPageConfig, Rule, Settings } from "@/shared/types";

export const K = {
  version: "aegis:v",
  rules: "aegis:rules",
  settings: "aegis:settings",
  lock: "aegis:lock",
  auth: "aegis:auth",
  throttle: "aegis:throttle",
  blockPage: "aegis:blockpage",
  session: "aegis:session",
  snooze: "aegis:snooze",
  guard: "aegis:guard",
} as const;

export interface AuthData {
  password: PasswordRecord;
  recovery: PasswordRecord;
}

export interface Throttle {
  fails: number;
  until: number;
}

const local = () => chrome.storage.local;
const session = () => chrome.storage.session;

async function read<T>(
  area: chrome.storage.StorageArea,
  key: string,
): Promise<unknown> {
  const out = await area.get(key);
  return (out as Record<string, T>)[key];
}

export const getVersion = async () =>
  Number((await read(local(), K.version)) ?? 0);
export const setVersion = () => local().set({ [K.version]: SCHEMA_VERSION });

export async function getRules(): Promise<Rule[]> {
  return sanitizeRules(await read(local(), K.rules));
}

export async function getSettings(): Promise<Settings> {
  const raw = await read(local(), K.settings);
  return raw ? sanitizeSettings(raw) : structuredClone(DEFAULT_SETTINGS);
}

export async function getBlockPage(): Promise<BlockPageConfig> {
  const raw = await read(local(), K.blockPage);
  return raw ? sanitizeBlockPage(raw) : structuredClone(DEFAULT_BLOCK_PAGE);
}

export async function getLockUntil(): Promise<number | null> {
  const raw = (await read(local(), K.lock)) as { until?: unknown } | undefined;
  const until = typeof raw?.until === "number" ? raw.until : 0;
  if (until > Date.now()) return until;
  if (raw) await local().remove(K.lock);
  return null;
}

export async function getAuth(): Promise<AuthData | null> {
  const raw = (await read(local(), K.auth)) as AuthData | undefined;
  const ok = (r?: PasswordRecord) =>
    !!r && typeof r.salt === "string" && typeof r.hash === "string";
  return raw && ok(raw.password) && ok(raw.recovery) ? raw : null;
}

export async function getThrottle(): Promise<Throttle> {
  const raw = (await read(local(), K.throttle)) as Partial<Throttle> | undefined;
  return { fails: raw?.fails ?? 0, until: raw?.until ?? 0 };
}

export const getSessionUntil = async () =>
  Number((await read(session(), K.session)) ?? 0);

export async function getSnoozed(): Promise<Record<string, number>> {
  const raw = (await read(session(), K.snooze)) as Record<string, number> | undefined;
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(raw ?? {}).filter(([, until]) => until > now),
  );
}

/** Last known-good copy of the lock-relevant data, kept in memory-only storage. */
export interface Guard {
  rules: Rule[];
  lockUntil: number | null;
}

export async function getGuard(): Promise<Guard | null> {
  return ((await read(session(), K.guard)) as Guard | undefined) ?? null;
}

export async function writeGuard(rules: Rule[], lockUntil: number | null) {
  await session().set({ [K.guard]: { rules, lockUntil } satisfies Guard });
}

export async function setRules(rules: Rule[]) {
  await writeGuard(rules, await getLockUntil());
  await local().set({ [K.rules]: rules });
}

export const setSettings = (s: Settings) => local().set({ [K.settings]: s });
export const setBlockPage = (c: BlockPageConfig) => local().set({ [K.blockPage]: c });
export const setAuth = (a: AuthData | null) =>
  a ? local().set({ [K.auth]: a }) : local().remove(K.auth);
export const setThrottle = (t: Throttle) => local().set({ [K.throttle]: t });
export const setSessionUntil = (until: number) =>
  until ? session().set({ [K.session]: until }) : session().remove(K.session);
export const setSnoozed = (s: Record<string, number>) =>
  session().set({ [K.snooze]: s });

export async function setLockUntil(until: number) {
  await writeGuard(await getRules(), until);
  await local().set({ [K.lock]: { until } });
}

export async function nextRuleNumber(rules: Rule[]): Promise<number> {
  return Math.max(0, ...rules.map((r) => r.n)) + 1;
}
