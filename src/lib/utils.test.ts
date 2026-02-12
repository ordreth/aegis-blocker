import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  downloadJsonFile,
  formatDuration,
  formatTimeRemaining,
  isValidPattern,
  readFileAsText,
  sanitizeUrl,
} from "./utils";

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

    it("should reject empty strings", () => {
      expect(isValidPattern("")).toBe(false);
    });

    it("should reject string with only space", () => {
      expect(isValidPattern("    ")).toBe(false);
    });

    it("should accept special characters as long as it has a dot and is long enough", () => {
      expect(isValidPattern("my-site.com")).toBe(true);
      expect(isValidPattern("my_site.com")).toBe(true);
      expect(isValidPattern("my site.com")).toBe(true);
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

    it("should enforce case insensitivity", () => {
      expect(sanitizeUrl("HTTPS://WWW.EXAMPLE.COM")).toBe(
        "HTTPS://WWW.EXAMPLE.COM",
      );
    });

    it("should garantee subdomanins are preserved", () => {
      expect(sanitizeUrl("https://blog.example.com")).toBe("blog.example.com");
    });

    it("should garantee paths are preserved", () => {
      expect(sanitizeUrl("https://example.com/path/to/page")).toBe(
        "example.com/path/to/page",
      );
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

    it("should format multiple days correctly", () => {
      const ms = 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 5 + 1000 * 60 * 10;
      expect(formatTimeRemaining(ms)).toBe("3d 5h 10m");
    });

    it("should format zero time correctly", () => {
      const ms = 0;
      expect(formatTimeRemaining(ms)).toBe("0h 0m 0s");
    });

    it("should format large durations correctly", () => {
      const ms = 1000 * 60 * 60 * 24 * 365 + 1000 * 60 * 60 * 2;
      expect(formatTimeRemaining(ms)).toBe("365d 2h 0m");
    });
  });

  describe("formatDuration", () => {
    it("should format hours only", () => {
      expect(formatDuration(5)).toBe("5 time_unit_hours");
    });

    it("should format days", () => {
      expect(formatDuration(24)).toBe("24h (1 time_unit_days)");
      expect(formatDuration(48)).toBe("48h (2 time_unit_days)");
    });

    it("should format months (approximate)", () => {
      expect(formatDuration(720)).toBe("720h (~1 time_unit_months)");
    });

    it("should format years (approximate)", () => {
      expect(formatDuration(8760)).toBe("8760h (~1 time_unit_year)");
    });
  });

  describe("readFileAsText", () => {
    it("should read file content successfully", async () => {
      const content = "Hello Aegis";
      const file = new File([content], "test.txt", { type: "text/plain" });

      const result = await readFileAsText(file);
      expect(result).toBe(content);
    });
  });

  describe("downloadJsonFile", () => {
    beforeEach(() => {
      globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create a link and trigger download", () => {
      const clickMock = vi.fn();
      const linkSpy = {
        href: "",
        download: "",
        click: clickMock,
        style: {},
      } as unknown as HTMLAnchorElement;

      vi.spyOn(document, "createElement").mockReturnValue(linkSpy);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => linkSpy);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => linkSpy);

      const jsonContent = JSON.stringify({ test: true });
      downloadJsonFile(jsonContent, "backup.json");

      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(linkSpy.download).toBe("backup.json");
      expect(linkSpy.href).toBe("blob:mock-url");
      expect(clickMock).toHaveBeenCalled();

      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:mock-url",
      );
    });
  });
});
