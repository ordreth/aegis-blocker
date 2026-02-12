import { describe, expect, it } from "vitest";
import { formatTimeRemaining, isValidPattern, sanitizeUrl } from "./utils";

describe("Utils Library", () => {
  describe("isValidPattern", () => {
    it("shoud acept valid domains", () => {
      expect(isValidPattern("google.com")).toBe(true);
      expect(isValidPattern("reddit.com/r/memes")).toBe(true);
    });

    it("shoud reject small strings", () => {
      expect(isValidPattern("abc")).toBe(false);
    });

    it("should reject strings without dot", () => {
      expect(isValidPattern("localhost")).toBe(false);
      expect(isValidPattern("randomword")).toBe(false);
    });
  });

  describe("sanitizeUrl", () => {
    it("should remove https://", () => {
      expect(sanitizeUrl("https://youtube.com")).toBe("youtube.com");
    });

    it("should remove http://", () => {
      expect(sanitizeUrl("http://notsecure.com")).toBe("notsecure.com");
    });

    it("should remove www.", () => {
      expect(sanitizeUrl("www.facebook.com")).toBe("facebook.com");
    });

    it("should clean everything together", () => {
      expect(sanitizeUrl("https://www.instagram.com")).toBe("instagram.com");
    });
  });

  describe("formatTimeRemaining", () => {
    it("should format seconds", () => {
      const ms = 1000 * 45;
      expect(formatTimeRemaining(ms)).toContain("45s");
    });

    it("should format minutes and seconds", () => {
      const ms = 1000 * 60 * 2 + 1000 * 30;
      expect(formatTimeRemaining(ms)).toBe("0h 2m 30s");
    });

    it("should format days when greater than 24h", () => {
      const ms = 1000 * 60 * 60 * 25;
      expect(formatTimeRemaining(ms)).toContain("1d 1h");
    });
  });
});
