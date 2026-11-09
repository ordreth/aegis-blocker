import { describe, expect, it } from "vitest";
import { createT, formatDuration, resolveLocale } from "./index";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { pt } from "./pt";
import { zh } from "./zh";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("catalogues", () => {
  for (const [name, dict] of Object.entries({ pt, es, de, zh })) {
    it(`${name} has every key and the same placeholders as English`, () => {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(dict[key]), `${name}.${key}`).toBe(placeholders(en[key]));
        expect(dict[key].trim(), `${name}.${key}`).not.toBe("");
      }
    });
  }
});

describe("t / locale", () => {
  it("interpolates", () => expect(createT("en")("rules_count", { n: 3 })).toBe("3 rules"));
  it("resolves locales", () => {
    expect(resolveLocale("system", "pt-BR")).toBe("pt");
    expect(resolveLocale("system", "zh-CN")).toBe("zh");
    expect(resolveLocale("system", "fr-FR")).toBe("en");
    expect(resolveLocale("de", "pt")).toBe("de");
  });
  it("formats durations", () => {
    const t = createT("en");
    expect(formatDuration(30 * 60_000, t)).toBe("30 min");
    expect(formatDuration(24 * 3_600_000, t)).toBe("24 h");
    expect(formatDuration(3 * 86_400_000, t)).toBe("3 d");
  });
});
