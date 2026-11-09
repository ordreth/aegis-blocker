import { beforeEach, describe, expect, it } from "vitest";
import { buildDnrRules } from "@/background/engine";
import { installChrome } from "@/test/chrome-mock";
import { compile } from "./linear";
import { parseAs, parseInput, ruleMatches, urlSource } from "./patterns";
import { sanitizeRule } from "./schema";
import type { Rule, RuleKind } from "./types";

const rule = (kind: RuleKind, pattern: string, n = 1): Rule => {
  const r = sanitizeRule({ kind, pattern, n });
  if (!r) throw new Error(`bad fixture: ${kind} ${pattern}`);
  return r;
};


beforeEach(() => {
  installChrome();
});

describe("hostile patterns", () => {
  it("refuses text that cannot be encoded instead of throwing later", () => {
    expect(parseAs("keyword", "\ud800x").ok).toBe(false);
    expect(parseAs("keyword", "x\udc00").ok).toBe(false);
    expect(parseAs("keyword", "😀 ok").ok).toBe(true);
    expect(sanitizeRule({ kind: "keyword", pattern: "ab\ud83d" })).toBeNull();
  });

  it("keeps a stored regex that happens to look slash-delimited", () => {
    // typed as //shorts//: the source is /shorts/ and must stay so on every later read
    const typed = parseAs("regex", "//shorts//");
    expect(typed).toMatchObject({ ok: true, pattern: "/shorts/" });
    expect(sanitizeRule({ kind: "regex", pattern: "/shorts/" })?.pattern).toBe("/shorts/");
  });

  it("answers 'invalid' for an unknown kind", () => {
    expect(parseAs("nope" as RuleKind, "example.com")).toEqual({ ok: false, reason: "invalid" });
  });
});

// Small deterministic generator: the same inputs on every run, no extra dependency.
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PIECES = [
  "a", "b", "Z", "1", ".", "/", "//", "?", "#", "*", "+", "-", "_", " ", "  ", "%", "%20", "%2F", "@", ":", "\\",
  "(", ")", "[", "]", "{", "}", "|", "^", "$", "{2,}", "(?:", "\\d", "\\.", "é", "İ", "ß", "😀", "\ud800", "\udc00",
  "\u0000", "\n", "\t", "‮", "www.", ".com", "example", "http://", "https://", "localhost", "xn--", "..", "*/",
];

describe("normalisation properties", () => {
  const kinds: RuleKind[] = ["domain", "path", "keyword", "regex"];
  const rand = prng(20241109);
  const inputs: string[] = [];
  for (let i = 0; i < 4000; i++) {
    let s = "";
    const len = 1 + Math.floor(rand() * 10);
    for (let j = 0; j < len; j++) s += PIECES[Math.floor(rand() * PIECES.length)];
    inputs.push(s);
  }
  inputs.push("İ".repeat(150), "//shorts//", "/a/b/", "/x/i", "EXAMPLE.com/Path/", "a".repeat(200), "é ".repeat(100));

  it("parsing never throws and is stable when applied to its own output", () => {
    for (const input of inputs) {
      const results = [parseInput(input), ...kinds.map((k) => parseAs(k, input))];
      for (const res of results) {
        if (!res.ok) continue;
        const stored = sanitizeRule({ kind: res.kind, pattern: res.pattern });
        expect(stored, `${res.kind} ${JSON.stringify(input)}`).not.toBeNull();
        expect([stored?.kind, stored?.pattern], JSON.stringify(input)).toEqual([res.kind, res.pattern]);
        const again = sanitizeRule(structuredClone(stored));
        expect([again?.kind, again?.pattern], JSON.stringify(input)).toEqual([res.kind, res.pattern]);
      }
    }
  });

  it("every accepted rule yields a usable filter and can be evaluated", () => {
    for (const input of inputs) {
      const res = parseInput(input);
      if (!res.ok) continue;
      const r = rule(res.kind, res.pattern);
      const source = urlSource(r);
      expect(() => new RegExp(source, "i"), JSON.stringify(input)).not.toThrow();
      expect(compile(source), JSON.stringify(input)).not.toBeNull(); // no look-around, no back-references
      expect(typeof ruleMatches(r, { url: "https://example.com/a?b=c#d", title: "A title" })).toBe("boolean");
      expect(buildDnrRules([r], Date.now(), new Set(), true)).toHaveLength(1);
    }
  });
});
