import { defaultScopes, MAX_RULES, parseAs, parseInput } from "./patterns";
import type {
  BlockPageConfig,
  BlockTheme,
  Locale,
  Rule,
  RuleKind,
  RuleScope,
  Schedule,
  Settings,
} from "./types";

export const SCHEMA_VERSION = 2;
export const LOCALES: Locale[] = ["en", "pt", "es", "de", "zh"];
export const MIN_LOCK_HOURS = 1;
export const MAX_LOCK_HOURS = 24 * 30;
export const MAX_IMPORT_BYTES = 1_000_000;

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  language: "system",
  confirmDelete: true,
  lockHours: 24,
  snooze: { enabled: false, waitSeconds: 30, minutes: 5 },
};

export const THEME_COLORS: Record<
  Exclude<BlockTheme, "custom">,
  BlockPageConfig["colors"]
> = {
  aegis: { bg: "#0d0d0d", card: "#171c26", text: "#f5f7fa", accent: "#d99543" },
  midnight: { bg: "#050816", card: "#0e1430", text: "#e6e9ff", accent: "#7c8cff" },
  paper: { bg: "#f4efe6", card: "#fffaf0", text: "#2b2620", accent: "#b4551d" },
  forest: { bg: "#0b1510", card: "#12241a", text: "#e8f3ec", accent: "#5fcf8a" },
  ocean: { bg: "#06161f", card: "#0b2733", text: "#e3f4fb", accent: "#38bdf8" },
  sunset: { bg: "#1c0f14", card: "#2a1620", text: "#fff1ec", accent: "#fb7185" },
  mono: { bg: "#000000", card: "#111111", text: "#ffffff", accent: "#ffffff" },
};

export const DEFAULT_BLOCK_PAGE: BlockPageConfig = {
  title: "",
  message: "",
  quotes: [],
  showQuote: true,
  rotateQuotes: true,
  theme: "aegis",
  colors: { ...THEME_COLORS.aegis },
  layout: "card",
  shape: "soft",
  icon: "shield",
  font: "sans",
  background: { kind: "none", mediaId: null, overlay: 55, blur: 0 },
  showUrl: true,
  showRule: false,
  showLockTimer: true,
  buttons: [],
  redirect: { enabled: false, url: "", delaySec: 8 },
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number, fallback = "") =>
  typeof v === "string" ? v.slice(0, max) : fallback;
const bool = (v: unknown, fallback: boolean) =>
  typeof v === "boolean" ? v : fallback;
const int = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, Math.round(v)))
    : fallback;
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
  typeof v === "string" && (list as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
const hex = (v: unknown, fallback: string) =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;

export function sanitizeSchedule(raw: unknown): Schedule | null {
  if (!isObj(raw) || !Array.isArray(raw.days)) return null;
  const days = [
    ...new Set(
      raw.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6),
    ),
  ].sort();
  if (days.length === 0) return null;
  return {
    days,
    start: int(raw.start, 0, 1439, 0),
    end: int(raw.end, 0, 1439, 0),
  };
}

const KINDS: readonly RuleKind[] = ["domain", "path", "keyword", "regex"];

/** Validates a stored/imported rule. Pattern is re-normalised, never trusted. */
export function sanitizeRule(raw: unknown): Rule | null {
  if (!isObj(raw)) return null;
  const kind = oneOf(raw.kind, KINDS, "domain");
  const parsed = parseAs(kind, str(raw.pattern, 400), true);
  if (!parsed.ok) return null;
  const scopes: RuleScope[] = Array.isArray(raw.scopes)
    ? (raw.scopes.filter((s) => s === "url" || s === "title") as RuleScope[])
    : [];
  return {
    id:
      typeof raw.id === "string" && /^[\w-]{8,64}$/.test(raw.id)
        ? raw.id
        : crypto.randomUUID(),
    n: int(raw.n, 1, 2_000_000_000, 0),
    kind: parsed.kind,
    pattern: parsed.pattern,
    mode: raw.mode === "allow" ? "allow" : "block",
    enabled: bool(raw.enabled, true),
    scopes: scopes.length ? [...new Set(scopes)] : defaultScopes(parsed.kind),
    schedule: sanitizeSchedule(raw.schedule),
    note: str(raw.note, 120),
    createdAt: int(raw.createdAt, 0, 8.64e15, Date.now()),
  };
}

/** Two rules with the same key do the same thing; only the first one is kept. */
export const ruleKey = (r: Pick<Rule, "mode" | "kind" | "pattern" | "schedule">) =>
  `${r.mode}|${r.kind}|${r.pattern}|${JSON.stringify(r.schedule)}`;

/** Sanitises a list, drops invalid/duplicate rules and assigns missing numeric ids. */
export function sanitizeRules(raw: unknown): Rule[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const seenN = new Set<number>();
  const seenKey = new Set<string>();
  const out: Rule[] = [];
  for (const item of raw) {
    const r = sanitizeRule(item);
    if (!r) continue;
    const key = ruleKey(r);
    if (seenKey.has(key) || seenIds.has(r.id)) continue;
    seenKey.add(key);
    seenIds.add(r.id);
    out.push(r);
    if (out.length >= MAX_RULES) break;
  }
  let next = Math.max(0, ...out.map((r) => r.n)) + 1;
  for (const r of out) {
    if (r.n === 0 || seenN.has(r.n)) r.n = next++;
    seenN.add(r.n);
  }
  return out;
}

export function sanitizeSettings(raw: unknown): Settings {
  const o = isObj(raw) ? raw : {};
  const s = isObj(o.snooze) ? o.snooze : {};
  const d = DEFAULT_SETTINGS;
  return {
    theme: oneOf(o.theme, ["system", "light", "dark"], d.theme),
    language: oneOf(o.language, ["system", ...LOCALES], d.language),
    confirmDelete: bool(o.confirmDelete, d.confirmDelete),
    lockHours: int(o.lockHours, MIN_LOCK_HOURS, MAX_LOCK_HOURS, d.lockHours),
    snooze: {
      enabled: bool(s.enabled, d.snooze.enabled),
      waitSeconds: int(s.waitSeconds, 5, 300, d.snooze.waitSeconds),
      minutes: int(s.minutes, 1, 60, d.snooze.minutes),
    },
  };
}

export const MAX_BUTTONS = 3;
export const MAX_QUOTES = 20;

const safeHttp = (v: unknown) => {
  if (typeof v !== "string" || v.length > 500) return "";
  try {
    const u = new URL(v.trim());
    return (u.protocol === "https:" || u.protocol === "http:") && !u.username
      ? u.toString()
      : "";
  } catch {
    return "";
  }
};

export function sanitizeBlockPage(raw: unknown): BlockPageConfig {
  const o = isObj(raw) ? raw : {};
  const d = DEFAULT_BLOCK_PAGE;
  const theme = oneOf<BlockTheme>(
    o.theme,
    [...(Object.keys(THEME_COLORS) as BlockTheme[]), "custom"],
    d.theme,
  );
  const c = isObj(o.colors) ? o.colors : {};
  const preset = theme === "custom" ? d.colors : THEME_COLORS[theme];
  const bg = isObj(o.background) ? o.background : {};
  const kind = oneOf(bg.kind, ["none", "image", "video"] as const, "none");
  const mediaId =
    typeof bg.mediaId === "string" && /^[\w-]{1,64}$/.test(bg.mediaId)
      ? bg.mediaId
      : null;
  const redirect = isObj(o.redirect) ? o.redirect : {};
  const redirectUrl = safeHttp(redirect.url);
  const buttons = Array.isArray(o.buttons)
    ? o.buttons
        .filter(isObj)
        .map((b) => ({ label: str(b.label, 40).trim(), url: safeHttp(b.url) }))
        .filter((b) => b.label && b.url)
        .slice(0, MAX_BUTTONS)
    : [];
  return {
    title: str(o.title, 80),
    message: str(o.message, 300),
    quotes: Array.isArray(o.quotes)
      ? o.quotes
          .map((q) => str(q, 200).trim())
          .filter(Boolean)
          .slice(0, MAX_QUOTES)
      : [],
    showQuote: bool(o.showQuote, d.showQuote),
    rotateQuotes: bool(o.rotateQuotes, d.rotateQuotes),
    theme,
    colors: {
      bg: hex(c.bg, preset.bg),
      card: hex(c.card, preset.card),
      text: hex(c.text, preset.text),
      accent: hex(c.accent, preset.accent),
    },
    layout: oneOf(o.layout, ["card", "center", "split"] as const, d.layout),
    shape: oneOf(o.shape, ["soft", "sharp", "pill"] as const, d.shape),
    icon: oneOf(
      o.icon,
      ["shield", "lock", "flame", "leaf", "eye", "none"] as const,
      d.icon,
    ),
    font: oneOf(o.font, ["sans", "serif", "mono"] as const, d.font),
    background: {
      kind: kind !== "none" && !mediaId ? "none" : kind,
      mediaId,
      overlay: int(bg.overlay, 0, 90, d.background.overlay),
      blur: int(bg.blur, 0, 24, d.background.blur),
    },
    showUrl: bool(o.showUrl, d.showUrl),
    showRule: bool(o.showRule, d.showRule),
    showLockTimer: bool(o.showLockTimer, d.showLockTimer),
    buttons,
    redirect: {
      enabled: bool(redirect.enabled, false) && !!redirectUrl,
      url: redirectUrl,
      delaySec: int(redirect.delaySec, 3, 120, d.redirect.delaySec),
    },
  };
}

// ---- import / export -------------------------------------------------------

export interface ExportFile {
  app: "aegis-blocker";
  version: number;
  rules: Pick<
    Rule,
    "kind" | "pattern" | "mode" | "enabled" | "scopes" | "schedule" | "note"
  >[];
}

export function exportRules(rules: Rule[]): string {
  const file: ExportFile = {
    app: "aegis-blocker",
    version: SCHEMA_VERSION,
    rules: rules.map(({ kind, pattern, mode, enabled, scopes, schedule, note }) => ({
      kind,
      pattern,
      mode,
      enabled,
      scopes,
      schedule,
      note,
    })),
  };
  return JSON.stringify(file, null, 2);
}

export interface ImportResult {
  rules: Rule[];
  skipped: number;
}

/** Accepts a v2 export or the legacy v1 array (`[{ urlPattern }]`). */
export function parseImport(json: string): ImportResult | null {
  if (json.length > MAX_IMPORT_BYTES) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  const items: unknown[] | null = Array.isArray(data)
    ? data
    : isObj(data) && data.app === "aegis-blocker" && Array.isArray(data.rules)
      ? data.rules
      : null;
  if (!items) return null;
  const rules: Rule[] = [];
  let skipped = 0;
  for (const item of items.slice(0, MAX_RULES * 2)) {
    let candidate: unknown = item;
    if (isObj(item) && typeof item.urlPattern === "string") {
      const p = parseInput(item.urlPattern);
      candidate = p.ok ? { kind: p.kind, pattern: p.pattern } : null;
    }
    const r = candidate ? sanitizeRule({ ...(candidate as Obj), id: undefined, n: 0 }) : null;
    if (r) rules.push(r);
    else skipped++;
  }
  return { rules, skipped };
}
