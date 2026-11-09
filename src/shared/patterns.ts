import type { ErrorCode, Rule, RuleKind, RuleScope } from "./types";

export const MAX_RULES = 900; // declarativeNetRequest allows 1000 regex rules
export const MAX_PATTERN_LENGTH = 200;
const MAX_MATCH_URL = 2048;
const MAX_MATCH_TITLE = 300;

export type ParseResult =
  | { ok: true; kind: RuleKind; pattern: string }
  | { ok: false; reason: ErrorCode };

const fail = (reason: ErrorCode): ParseResult => ({ ok: false, reason });

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;
const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const PATH_RE = /^[a-z0-9\-._~!$&'()*+,;=:@%/?]*$/;

interface HostPath {
  host: string;
  path: string;
}

function splitHostPath(raw: string): HostPath | null {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^\/\//, "");
  s = s.replace(/#.*$/, "");
  const cut = s.search(/[/?]/);
  let host = cut === -1 ? s : s.slice(0, cut);
  let path = cut === -1 ? "" : s.slice(cut);
  host = host
    .replace(/^.*@/, "")
    .replace(/:\d+$/, "")
    .replace(/^\*\./, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
  if (!host || host.includes("*") || /\s/.test(host)) return null;
  try {
    host = new URL(`http://${host}`).hostname;
  } catch {
    return null;
  }
  if (!(HOST_RE.test(host) || host === "localhost" || IPV4_RE.test(host)))
    return null;
  if (path.startsWith("?") || path.startsWith("/?")) path = "";
  if (path.length > 1 && path.endsWith("/") && !path.endsWith("*/"))
    path = path.replace(/\/+$/, "");
  if (path === "/") path = "";
  return { host, path };
}

const MAX_UNBOUNDED_QUANTIFIERS = 4;

/**
 * Guard against catastrophic backtracking: the service worker runs user regexes
 * with the JS engine (DNR uses RE2, which is linear). Rejects back-references,
 * look-around, any repetition applied to a group (`(a|a)+`, `((a+))+`, `(x){30}`)
 * and patterns stacking many quantifiers, which can go polynomial.
 */
export function isRegexSafe(src: string): boolean {
  if (/\\[1-9]|\(\?[=!<]/.test(src)) return false;
  let quantifiers = 0;
  let inClass = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++;
    } else if (inClass) {
      if (c === "]") inClass = false;
    } else if (c === "[") {
      inClass = true;
    } else if (c === "*" || c === "+") {
      quantifiers++;
    } else if (c === "{" && /^\{\d+(?:,\d*)?\}/.test(src.slice(i))) {
      quantifiers++;
    } else if (c === ")" && /^(?:[*+]|\{\d+(?:,\d*)?\})/.test(src.slice(i + 1))) {
      return false;
    }
  }
  return quantifiers <= MAX_UNBOUNDED_QUANTIFIERS;
}

function parseRegex(input: string): ParseResult {
  const m = /^\/(.+)\/[a-z]*$/s.exec(input.trim());
  const src = (m ? m[1] : input.trim()) ?? "";
  if (!src) return fail("empty");
  if (src.length > MAX_PATTERN_LENGTH) return fail("too_long");
  let re: RegExp;
  try {
    re = new RegExp(src, "i");
  } catch {
    return fail("invalid_regex");
  }
  if (!isRegexSafe(src)) return fail("unsafe_regex");
  if (re.test("") || re.test("https://example.com/")) return fail("too_broad");
  return { ok: true, kind: "regex", pattern: src };
}

function parseKeyword(input: string): ParseResult {
  const kw = input.trim().replace(/\s+/g, " ");
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(kw)) return fail("invalid");
  if (kw.length < 2) return fail(kw ? "too_broad" : "empty");
  if (kw.length > MAX_PATTERN_LENGTH) return fail("too_long");
  return { ok: true, kind: "keyword", pattern: kw.toLowerCase() };
}

function parseHostPath(input: string, wanted?: "domain" | "path"): ParseResult {
  if (input.length > MAX_PATTERN_LENGTH) return fail("too_long");
  const hp = splitHostPath(input);
  if (!hp) return fail("invalid_host");
  if (hp.path && !PATH_RE.test(hp.path)) return fail("invalid");
  if (wanted === "domain" || !hp.path)
    return { ok: true, kind: "domain", pattern: hp.host };
  return { ok: true, kind: "path", pattern: hp.host + hp.path };
}

const looksLikeHost = (s: string) => {
  const t = s.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  if (/\s/.test(t)) return false;
  const host = t.split(/[/?#]/)[0] ?? "";
  return host.includes(".") || host.toLowerCase() === "localhost";
};

/** Detects the kind from free text and normalises it. */
export function parseInput(raw: string): ParseResult {
  const t = raw.trim();
  if (!t) return fail("empty");
  if (/^\/.+\/[a-z]*$/s.test(t)) return parseRegex(t);
  if (looksLikeHost(t)) return parseHostPath(t);
  return parseKeyword(t);
}

/** Normalises a pattern for an already-known kind. */
export function parseAs(kind: RuleKind, raw: string): ParseResult {
  switch (kind) {
    case "regex":
      return parseRegex(raw);
    case "keyword":
      return parseKeyword(raw);
    case "domain":
    case "path": {
      const r = parseHostPath(raw);
      if (!r.ok) return r;
      return kind === "domain" && r.kind === "path"
        ? fail("invalid")
        : { ok: true, kind: r.kind, pattern: r.pattern };
    }
  }
}

function keywordSource(kw: string): string {
  const variants = new Set([kw, encodeURIComponent(kw).toLowerCase()]);
  const parts = [...variants].map((v) =>
    v
      .split(/ |%20/)
      .map(escapeRe)
      .join("(?:[+ _.-]|%20)+"),
  );
  return parts.length === 1 ? (parts[0] ?? "") : `(?:${parts.join("|")})`;
}

/**
 * RE2-compatible source (also valid for JS) for the URL part of a rule.
 * Matches the full URL; domain/path rules are anchored to the host.
 */
export function urlSource(rule: Pick<Rule, "kind" | "pattern">): string {
  const prefix = "^https?://(?:[^/?#@]*@)?(?:[^/?#]*\\.)?";
  switch (rule.kind) {
    case "keyword":
      return keywordSource(rule.pattern);
    case "regex":
      return rule.pattern;
    case "domain":
      return `${prefix}${escapeRe(rule.pattern)}(?::\\d+)?(?:[/?#]|$)`;
    case "path": {
      const slash = rule.pattern.indexOf("/");
      const host = rule.pattern.slice(0, slash);
      const path = rule.pattern.slice(slash);
      const open = path.endsWith("*") || path.includes("?");
      const body = path.split("*").map(escapeRe).join("[^#]*");
      return `${prefix}${escapeRe(host)}(?::\\d+)?${body}${open ? "" : "(?:[/?#]|$)"}`;
    }
  }
}

const reCache = new Map<string, RegExp>();
function test(src: string, text: string): boolean {
  let re = reCache.get(src);
  if (!re) {
    re = new RegExp(src, "i");
    if (reCache.size > 2000) reCache.clear();
    reCache.set(src, re);
  }
  return re.test(text);
}

export interface MatchContext {
  url?: string | undefined;
  title?: string | undefined;
}

export function ruleMatches(
  rule: Pick<Rule, "kind" | "pattern" | "scopes">,
  ctx: MatchContext,
): boolean {
  const src = urlSource(rule);
  const scopes: RuleScope[] =
    rule.kind === "domain" || rule.kind === "path" ? ["url"] : rule.scopes;
  if (scopes.includes("url") && ctx.url && /^https?:\/\//i.test(ctx.url)) {
    if (test(src, ctx.url.slice(0, MAX_MATCH_URL))) return true;
  }
  if (scopes.includes("title") && ctx.title) {
    if (test(src, ctx.title.slice(0, MAX_MATCH_TITLE))) return true;
  }
  return false;
}

export function defaultScopes(kind: RuleKind): RuleScope[] {
  return kind === "keyword" || kind === "regex" ? ["url", "title"] : ["url"];
}

/** Host of an http(s) URL without `www.`, or null. */
export function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && !u.username;
  } catch {
    return false;
  }
}

/** The browser-normalised form of an http(s) URL (no credentials), or null. */
export function normalizeHttpUrl(value: string): string | null {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && !u.username ? u.href : null;
  } catch {
    return null;
  }
}
