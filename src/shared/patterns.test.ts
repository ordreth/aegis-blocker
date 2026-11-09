import { describe, expect, it } from "vitest";
import { hostOf, isHttpUrl, parseAs, parseInput, ruleMatches } from "./patterns";
import type { Rule } from "./types";

const rule = (kind: Rule["kind"], pattern: string, scopes: Rule["scopes"] = ["url"]) =>
  ({ kind, pattern, scopes }) as Pick<Rule, "kind" | "pattern" | "scopes">;

describe("parseInput", () => {
  it("detects domains and strips scheme, www, port, query", () => {
    expect(parseInput("https://www.Reddit.com:8080/?a=1#x")).toEqual({
      ok: true,
      kind: "domain",
      pattern: "reddit.com",
    });
  });
  it("detects paths and drops trailing slashes", () => {
    expect(parseInput("reddit.com/r/Memes/")).toEqual({
      ok: true,
      kind: "path",
      pattern: "reddit.com/r/memes",
    });
  });
  it("detects keywords and regex", () => {
    expect(parseInput("  Cat   Videos ")).toMatchObject({ kind: "keyword", pattern: "cat videos" });
    expect(parseInput("/(shorts|reels)/i")).toMatchObject({ kind: "regex", pattern: "(shorts|reels)" });
  });
  it("rejects garbage", () => {
    expect(parseInput("")).toMatchObject({ ok: false, reason: "empty" });
    expect(parseInput("a")).toMatchObject({ ok: false });
    expect(parseInput("bad_host!.com")).toMatchObject({ ok: false, reason: "invalid_host" });
    expect(parseInput("exa*mple.com")).toMatchObject({ ok: false });
  });
  it("rejects dangerous or over-broad regex", () => {
    expect(parseInput("/(a+)+$/")).toMatchObject({ ok: false, reason: "unsafe_regex" });
    expect(parseInput("/.*/")).toMatchObject({ ok: false, reason: "too_broad" });
    expect(parseInput("/(/")).toMatchObject({ ok: false, reason: "invalid_regex" });
    expect(parseInput("/(?=x)y/")).toMatchObject({ ok: false });
  });
  it("converts IDN hosts to punycode", () => {
    expect(parseInput("exemplo.com.br")).toMatchObject({ pattern: "exemplo.com.br" });
    expect(parseInput("münchen.de")).toMatchObject({ pattern: "xn--mnchen-3ya.de" });
  });
});

describe("parseAs", () => {
  it("refuses a domain rule that carries a path", () => {
    expect(parseAs("domain", "a.com/x")).toMatchObject({ ok: false });
  });
  it("normalises a bare host given as a path rule to a domain rule", () => {
    expect(parseAs("path", "a.com")).toMatchObject({ ok: true, kind: "domain" });
  });
});

describe("ruleMatches", () => {
  it("domain rules cover subdomains but not look-alikes", () => {
    const r = rule("domain", "reddit.com");
    for (const u of [
      "https://reddit.com",
      "https://old.reddit.com/r/a",
      "http://www.reddit.com:443/x?y#z",
    ])
      expect(ruleMatches(r, { url: u })).toBe(true);
    for (const u of [
      "https://notreddit.com/",
      "https://reddit.com.evil.io/",
      "https://evil.io/?u=reddit.com",
      "https://evil.io/reddit.com",
    ])
      expect(ruleMatches(r, { url: u })).toBe(false);
  });
  it("is not fooled by userinfo tricks", () => {
    const r = rule("domain", "reddit.com");
    expect(ruleMatches(r, { url: "https://x@reddit.com/" })).toBe(true);
    expect(ruleMatches(r, { url: "https://reddit.com@evil.io/" })).toBe(false);
  });
  it("path rules respect segment boundaries", () => {
    const r = rule("path", "reddit.com/r/memes");
    expect(ruleMatches(r, { url: "https://www.reddit.com/r/memes" })).toBe(true);
    expect(ruleMatches(r, { url: "https://reddit.com/r/Memes/comments/1" })).toBe(true);
    expect(ruleMatches(r, { url: "https://reddit.com/r/memes?sort=top" })).toBe(true);
    expect(ruleMatches(r, { url: "https://reddit.com/r/memestudy" })).toBe(false);
    expect(ruleMatches(r, { url: "https://reddit.com/r/programming" })).toBe(false);
  });
  it("supports * wildcards in paths", () => {
    const r = rule("path", "youtube.com/watch?v=*&list=*");
    expect(ruleMatches(r, { url: "https://youtube.com/watch?v=1&list=2" })).toBe(true);
    expect(ruleMatches(r, { url: "https://youtube.com/watch?v=1" })).toBe(false);
  });
  it("keywords match raw, encoded and spaced forms in URLs and titles", () => {
    const r = rule("keyword", "cat videos", ["url", "title"]);
    expect(ruleMatches(r, { url: "https://google.com/search?q=Cat+Videos" })).toBe(true);
    expect(ruleMatches(r, { url: "https://google.com/search?q=cat%20videos" })).toBe(true);
    expect(ruleMatches(r, { url: "https://x.com/", title: "Funny CAT videos 2026" })).toBe(true);
    expect(ruleMatches(r, { url: "https://x.com/dogs" })).toBe(false);
    const accent = rule("keyword", "ação");
    expect(ruleMatches(accent, { url: "https://x.com/a%C3%A7%C3%A3o" })).toBe(true);
  });
  it("respects scopes", () => {
    const urlOnly = rule("keyword", "memes", ["url"]);
    expect(ruleMatches(urlOnly, { url: "https://x.com/", title: "memes" })).toBe(false);
    const titleOnly = rule("keyword", "memes", ["title"]);
    expect(ruleMatches(titleOnly, { url: "https://x.com/memes", title: "hi" })).toBe(false);
    expect(ruleMatches(titleOnly, { url: "https://x.com/", title: "memes" })).toBe(true);
  });
  it("regex rules run against the full URL, case-insensitively", () => {
    const r = rule("regex", "/(shorts|reels)(/|$)", ["url"]);
    expect(ruleMatches(rule("regex", "(shorts|reels)(/|$)"), { url: "https://youtube.com/SHORTS/abc" })).toBe(true);
    expect(ruleMatches(r, { url: "https://youtube.com/watch" })).toBe(false);
  });
  it("never matches non-http(s) URLs", () => {
    expect(ruleMatches(rule("keyword", "memes"), { url: "chrome://memes" })).toBe(false);
  });
});

describe("helpers", () => {
  it("hostOf / isHttpUrl", () => {
    expect(hostOf("https://www.a.com/x")).toBe("a.com");
    expect(hostOf("chrome://extensions")).toBeNull();
    expect(isHttpUrl("https://a.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("https://u:p@a.com")).toBe(false);
  });
});
