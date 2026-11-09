import { describe, expect, it } from "vitest";
import { ruleMatches } from "./patterns";
import { sanitizeRule } from "./schema";
import type { Rule, RuleKind } from "./types";

const rule = (kind: RuleKind, pattern: string, n = 1): Rule => {
  const r = sanitizeRule({ kind, pattern, n });
  if (!r) throw new Error(`bad fixture: ${kind} ${pattern}`);
  return r;
};


describe("address variants a site still answers to", () => {
  it("a trailing dot on the host does not escape domain and path rules", () => {
    const d = rule("domain", "example.com");
    expect(ruleMatches(d, { url: "https://example.com./" })).toBe(true);
    expect(ruleMatches(d, { url: "https://www.example.com.:8443/feed" })).toBe(true);
    expect(ruleMatches(d, { url: "https://example.com.evil.test/" })).toBe(false);
    const p = rule("path", "example.com/shorts");
    expect(ruleMatches(p, { url: "https://example.com./shorts/1" })).toBe(true);
  });

  it("percent-encoded letters do not escape path, keyword and regex rules", () => {
    expect(ruleMatches(rule("path", "example.com/shorts"), { url: "https://example.com/%73horts/1" })).toBe(true);
    expect(ruleMatches(rule("path", "example.com/r/all"), { url: "https://example.com/r/%61%6C%6c" })).toBe(true);
    expect(ruleMatches(rule("keyword", "casino"), { url: "https://x.example/c%61sino" })).toBe(true);
    expect(ruleMatches(rule("regex", "/watch\\?v="), { url: "https://x.example/w%61tch?v=1" })).toBe(true);
    // an encoded separator is a different address and must stay one
    expect(ruleMatches(rule("path", "example.com/a/b"), { url: "https://example.com/a%2Fb" })).toBe(false);
    expect(ruleMatches(rule("path", "example.com/a"), { url: "https://example.com/%2561" })).toBe(false);
  });
});
