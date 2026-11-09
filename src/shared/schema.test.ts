import { describe, expect, it } from "vitest";
import {
  DEFAULT_BLOCK_PAGE,
  exportRules,
  parseImport,
  sanitizeBlockPage,
  sanitizeRules,
  sanitizeSettings,
} from "./schema";

describe("sanitizeRules", () => {
  it("drops invalid and duplicate rules and assigns unique numeric ids", () => {
    const rules = sanitizeRules([
      { kind: "domain", pattern: "https://www.A.com/x" },
      { kind: "domain", pattern: "a.com" },
      { kind: "regex", pattern: "(a+)+$" },
      { kind: "nope", pattern: "b.com" },
      "junk",
      null,
    ]);
    expect(rules.map((r) => r.pattern)).toEqual(["a.com", "b.com"]);
    expect(new Set(rules.map((r) => r.n)).size).toBe(rules.length);
    expect(rules[0]?.scopes).toEqual(["url"]);
  });
  it("is safe against prototype pollution and huge input", () => {
    const rules = sanitizeRules(JSON.parse('[{"kind":"domain","pattern":"a.com","__proto__":{"x":1}}]'));
    expect(({} as Record<string, unknown>).x).toBeUndefined();
    expect(rules).toHaveLength(1);
    expect(sanitizeRules(Array.from({ length: 5000 }, (_, i) => ({ kind: "domain", pattern: `s${i}.com` })))).toHaveLength(900);
  });
});

describe("sanitizeSettings", () => {
  it("clamps and defaults", () => {
    const s = sanitizeSettings({ lockHours: 99999, theme: "neon", snooze: { minutes: -4, enabled: true } });
    expect(s.lockHours).toBe(720);
    expect(s.theme).toBe("dark");
    expect(s.snooze).toMatchObject({ enabled: true, minutes: 1 });
  });
});

describe("sanitizeBlockPage", () => {
  it("only keeps http(s) links and valid colors", () => {
    const c = sanitizeBlockPage({
      colors: { bg: "red", text: "#FFFFFF" },
      buttons: [
        { label: "ok", url: "https://example.com" },
        { label: "xss", url: "javascript:alert(1)" },
        { label: "data", url: "data:text/html,hi" },
        { label: "creds", url: "https://u:p@example.com" },
      ],
      redirect: { enabled: true, url: "file:///etc/passwd" },
      background: { kind: "video", mediaId: null },
    });
    expect(c.buttons).toHaveLength(1);
    expect(c.redirect.enabled).toBe(false);
    expect(c.colors.bg).toBe(DEFAULT_BLOCK_PAGE.colors.bg);
    expect(c.colors.text).toBe("#ffffff");
    expect(c.background.kind).toBe("none");
  });
  it("rejects path-traversal-ish media ids", () => {
    expect(sanitizeBlockPage({ background: { kind: "image", mediaId: "../x" } }).background.mediaId).toBeNull();
  });
});

describe("import / export", () => {
  it("round-trips", () => {
    const rules = sanitizeRules([{ kind: "path", pattern: "reddit.com/r/memes", mode: "block" }]);
    const back = parseImport(exportRules(rules));
    expect(back?.rules.map((r) => r.pattern)).toEqual(["reddit.com/r/memes"]);
  });
  it("accepts the legacy v1 format", () => {
    const back = parseImport(
      JSON.stringify([{ urlPattern: "twitter.com", matchType: "contains" }, { urlPattern: "youtube.com/shorts" }, { nope: 1 }]),
    );
    expect(back?.rules.map((r) => `${r.kind}:${r.pattern}`)).toEqual(["domain:twitter.com", "path:youtube.com/shorts"]);
    expect(back?.skipped).toBe(1);
  });
  it("rejects foreign, invalid and oversized files", () => {
    expect(parseImport("{")).toBeNull();
    expect(parseImport('{"rules":[]}')).toBeNull();
    expect(parseImport("x".repeat(2_000_000))).toBeNull();
  });
});
