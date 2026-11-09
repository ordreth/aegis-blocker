import { beforeEach, describe, expect, it } from "vitest";
import { ruleMatches } from "@/shared/patterns";
import { sanitizeRule } from "@/shared/schema";
import type { Rule, RuleKind } from "@/shared/types";
import { installChrome } from "@/test/chrome-mock";
import { buildDnrRules } from "./engine";

const rule = (kind: RuleKind, pattern: string, n = 1): Rule => {
  const r = sanitizeRule({ kind, pattern, n });
  if (!r) throw new Error(`bad fixture: ${kind} ${pattern}`);
  return r;
};

/**
 * What Chrome does with a `regexSubstitution` redirect: the first match of the
 * filter inside the URL is replaced, the rest of the URL is kept as it is.
 */
function dnrRedirect(r: Rule, url: string): string | null {
  const [dnr] = buildDnrRules([r], Date.now(), new Set(), true);
  const filter = dnr?.condition.regexFilter;
  const substitution = dnr?.action.redirect?.regexSubstitution;
  if (!filter || !substitution) return null;
  const re = new RegExp(filter, "i");
  if (!re.test(url)) return null;
  return url.replace(re, substitution.replace(/\$/g, "$$$$").replace(/\\0/g, "$$&"));
}

beforeEach(() => {
  installChrome();
});

describe("declarativeNetRequest redirect", () => {
  const cases: [RuleKind, string, string][] = [
    ["domain", "example.com", "https://www.example.com/watch?v=1#t=3"],
    ["path", "example.com/shorts", "https://example.com/shorts/abc?x=1"],
    ["path", "example.com/a*b", "https://example.com/a-and-b/more"],
    ["keyword", "cat videos", "https://search.example/find?q=Cat+Videos&page=2"],
    ["keyword", "casino", "https://casino-royale.example/play"],
    ["regex", "reddit\\.com/r/\\w+", "https://old.reddit.com/r/all/top?t=day"],
  ];
  it.each(cases)("sends the whole address to the block page (%s %s)", (kind, pattern, url) => {
    expect(dnrRedirect(rule(kind, pattern, 7), url)).toBe(`chrome-extension://test-ext/blocked.html?r=7#${url}`);
  });

  it("matches exactly what the service worker matches", () => {
    const urls = [
      "https://example.com/",
      "https://example.com./x",
      "https://notexample.com/",
      "https://a.example/?q=cat%20videos",
      "https://a.example/concatenate",
    ];
    for (const r of [rule("domain", "example.com"), rule("keyword", "cat videos"), rule("regex", "^https://a\\.example/\\?")])
      for (const url of urls) expect(dnrRedirect(r, url) !== null, `${r.pattern} ${url}`).toBe(ruleMatches(r, { url }));
  });
});
