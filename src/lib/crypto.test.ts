import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSalt,
  generateRecoveryCode,
} from "./crypto";

describe("Crypto Library", () => {
  describe("generateSalt", () => {
    it("should generate a defined, non-empty string", () => {
      const salt = generateSalt();
      expect(salt).toBeDefined();
      expect(salt.length).toBeGreaterThan(0);
    });

    it("should generate a 32-character hex string (16 bytes)", () => {
      const salt = generateSalt();
      expect(salt.length).toBe(32);
      expect(salt).toMatch(/^[0-9a-fA-F]+$/);
    });

    it("should be unique on each call", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe("hashPassword & verifyPassword", () => {
    it("should hash the password and verify it correctly (Success Flow)", async () => {
      const password = "minhaSenhaSecreta123";
      const salt = generateSalt();

      const hash = await hashPassword(password, salt);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password (Failure Flow)", async () => {
      const password = "senhaCorreta";
      const wrongPassword = "senhaErrada";
      const salt = generateSalt();

      const hash = await hashPassword(password, salt);

      const isValid = await verifyPassword(wrongPassword, hash, salt);
      expect(isValid).toBe(false);
    });

    it("should produce the same hash for the same input (Determinism)", async () => {
      const password = "teste";
      const salt = "salt_fixo_para_teste";

      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, salt);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for same password with different salts", async () => {
      const password = "mesmaSenha";
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const hash1 = await hashPassword(password, salt1);
      const hash2 = await hashPassword(password, salt2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty passwords correctly", async () => {
      const password = "";
      const salt = generateSalt();

      const hash = await hashPassword(password, salt);
      expect(hash).toBeDefined();

      const isValid = await verifyPassword("", hash, salt);
      expect(isValid).toBe(true);
    });
  });

  describe("generateRecoveryCode", () => {
    it("should match the format XXXX-XXXX-XXXX", () => {
      const code = generateRecoveryCode();
      const formatRegex = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

      expect(code).toMatch(formatRegex);
      expect(code.length).toBe(14);
    });

    it("should NOT contain ambiguous characters (0, O, 1, I)", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateRecoveryCode();
        expect(code).not.toContain("0");
        expect(code).not.toContain("O");
        expect(code).not.toContain("1");
        expect(code).not.toContain("I");
      }
    });

    it("should be unique", () => {
      const code1 = generateRecoveryCode();
      const code2 = generateRecoveryCode();
      expect(code1).not.toBe(code2);
    });
  });
});
