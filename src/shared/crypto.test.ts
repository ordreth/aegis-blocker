import { describe, expect, it } from "vitest";
import {
  createRecord,
  generateRecoveryCode,
  normalizeRecoveryCode,
  safeEqual,
  verifyRecord,
} from "./crypto";

describe("password records", () => {
  it("verifies the right password only, with unique salts", async () => {
    const a = await createRecord("correct horse", 1000);
    const b = await createRecord("correct horse", 1000);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyRecord("correct horse", a)).toBe(true);
    expect(await verifyRecord("wrong", a)).toBe(false);
  });
  it("refuses absurd iteration counts", async () => {
    const a = await createRecord("pw", 1000);
    expect(await verifyRecord("pw", { ...a, iterations: 1 })).toBe(false);
    expect(await verifyRecord("pw", { ...a, iterations: 1e9 })).toBe(false);
  });
  it("still verifies the legacy v1 hash (sha256(password + salt))", async () => {
    const salt = "abcd";
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("secret" + salt));
    const hash = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    const rec = { kdf: "sha256-legacy" as const, iterations: 0, salt, hash };
    expect(await verifyRecord("secret", rec)).toBe(true);
    expect(await verifyRecord("Secret", rec)).toBe(false);
  });
});

describe("recovery codes", () => {
  it("has 80 bits in 4-4-4-4 groups from an unambiguous alphabet", () => {
    const c = generateRecoveryCode();
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
    expect(generateRecoveryCode()).not.toBe(c);
    expect(normalizeRecoveryCode(c.toLowerCase())).toBe(c.replaceAll("-", ""));
  });
  it("safeEqual", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
