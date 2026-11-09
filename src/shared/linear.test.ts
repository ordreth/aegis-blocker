import { describe, expect, it } from "vitest";
import { compile } from "./linear";
import { parseAs, ruleMatches } from "./patterns";
import { sanitizeRule } from "./schema";

const matches = (src: string, text: string) => {
  const m = compile(src);
  if (!m) throw new Error(`not compiled: ${src}`);
  return m(text);
};

describe("linear matcher", () => {
  it("agrees with RegExp on hand-picked cases", () => {
    const cases: [string, string][] = [
      ["^https?://(?:[^/?#@]*@)?(?:[^/?#]*\\.)?example\\.com(?::\\d+)?(?:[/?#]|$)", "https://www.Example.com:8080/x"],
      ["^https?://(?:[^/?#@]*@)?(?:[^/?#]*\\.)?example\\.com(?::\\d+)?(?:[/?#]|$)", "https://example.com.evil.test/"],
      ["cat(?:[+ _.-]|%20)+videos", "https://x.test/?q=Cat%20%20Videos"],
      ["\\bfoo\\b", "a foo."],
      ["\\bfoo\\b", "afoo"],
      ["a{2,3}$", "caaa"],
      ["a{2,3}$", "ca"],
      ["[^a-c\\d]x", "1x dx"],
      ["(shorts|reels)/\\w+", "/REELS/abc"],
      ["^$", ""],
      ["a{", "a{"],
      ["x{2", "xx{2"],
      ["[\\]\\-]", "-"],
      ["\\x41\\u0042", "ab"],
      ["\\.\\/\\?", "./?"],
      ["é+", "ÉÉ"],
      ["[^]", "\n"],
      ["[]", "a"],
      ["(?:)", ""],
      ["a|", "zzz"],
      ["\\Bb", "ab b"],
      ["a.c", "a\nc"],
    ];
    for (const [src, text] of cases) expect(matches(src, text), `${src} on ${JSON.stringify(text)}`).toBe(new RegExp(src, "i").test(text));
  });

  it("agrees with RegExp on generated patterns", () => {
    let seed = 0x5eed1234;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
    const plain = ["a", "b", "c", "A", "1", "_", "/", " ", "-", "é", "\\.", "\\/", ".", "\\d", "\\w", "\\s", "\\D", "\\W", "\\S",
      "[ab]", "[^a]", "[a-c]", "[^\\d/]", "[\\w-]", "[A-B1]", "{", "}", "]", "\\t", "\\x61"] as const;
    const anchors = ["^", "$", "\\b", "\\B"] as const;
    const quantifiers = ["", "", "", "", "*", "+", "?", "{2}", "{1,2}", "{0,}", "{2,}", "*?", "+?", "??"] as const;
    const sequence = (depth: number): string => {
      let out = "";
      const len = 1 + Math.floor(rand() * 4);
      for (let k = 0; k < len; k++) {
        const roll = rand();
        if (roll < 0.12) out += pick(anchors);
        else if (roll < 0.3 && depth > 0) out += `(?:${sequence(depth - 1)})${pick(quantifiers)}`;
        else if (roll < 0.42 && depth > 0) out += `(${sequence(depth - 1)}|${sequence(depth - 1)})${pick(quantifiers)}`;
        else out += pick(plain) + pick(quantifiers);
      }
      return out;
    };
    const alphabet = "abcABC/.1_ é-{}]\n\t";
    let compared = 0;
    for (let n = 0; n < 4000; n++) {
      const src = sequence(2);
      let re: RegExp;
      try {
        re = new RegExp(src, "i");
      } catch {
        continue;
      }
      const m = compile(src);
      expect(m, src).not.toBeNull();
      for (let k = 0; k < 6; k++) {
        let text = "";
        const len = Math.floor(rand() * 10);
        for (let j = 0; j < len; j++) text += alphabet[Math.floor(rand() * alphabet.length)];
        expect(m?.(text), `${src} on ${JSON.stringify(text)}`).toBe(re.test(text));
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(15_000);
  });

  it("refuses what it cannot reproduce faithfully", () => {
    for (const src of ["(?=a)", "(?!a)", "(?<=a)b", "(?<n>a)", "(a)\\1", "\\p{L}", "\\k", "a{2000}", "(", "a)", "[a", "*a", "\\", "(?i:a)"])
      expect(compile(src), src).toBeNull();
    expect(compile("a{1000}".repeat(30))).toBeNull(); // would need a huge program
  });

  it("stays fast on patterns that make a backtracking engine hang", () => {
    const long = "a".repeat(2000);
    const start = performance.now();
    expect(matches("a*a*a*a*b", `https://e.test/${long}`)).toBe(false);
    expect(matches("(?:a|a)*b", long)).toBe(false);
    expect(matches("(?:a*)*b", long)).toBe(false);
    expect(matches("a?".repeat(60) + "a{60}", "a".repeat(59))).toBe(false);
    expect(matches("a?".repeat(60) + "a{60}", "a".repeat(60))).toBe(true);
    expect(performance.now() - start).toBeLessThan(1500);
  });
});

describe("rules that used to freeze the service worker", () => {
  const rule = (kind: "keyword" | "path" | "regex", pattern: string) => {
    const r = sanitizeRule({ kind, pattern });
    if (!r) throw new Error("bad fixture");
    return r;
  };
  it("are evaluated in bounded time whatever the page sends", () => {
    const start = performance.now();
    // a keyword made of separator characters: the generated filter repeats overlapping groups
    const dots = rule("keyword", ". . . . . . . . . . . . x");
    expect(ruleMatches(dots, { url: `https://e.test/?${".".repeat(1900)}`, title: ".".repeat(300) })).toBe(false);
    // many wildcards in a path rule
    const stars = rule("path", "e.test/*a*a*a*a*a*a*a*a*b");
    expect(ruleMatches(stars, { url: `https://e.test/${"a".repeat(1900)}` })).toBe(false);
    expect(ruleMatches(stars, { url: `https://e.test/${"a".repeat(1900)}b` })).toBe(true);
    // user regexes that pass the static guard yet go polynomial or exponential
    expect(parseAs("regex", "a*a*a*a*b").ok).toBe(true);
    expect(ruleMatches(rule("regex", "a*a*a*a*b"), { url: `https://e.test/${"a".repeat(1900)}` })).toBe(false);
    const optional = "x?".repeat(40) + "x{40}";
    expect(parseAs("regex", optional).ok).toBe(true);
    expect(ruleMatches(rule("regex", optional), { title: "x".repeat(39) })).toBe(false);
    expect(performance.now() - start).toBeLessThan(2000);
  });
});
