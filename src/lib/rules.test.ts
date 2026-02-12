import { describe, it, expect, vi, beforeEach } from "vitest";
import { addRule, removeRule, getLockState } from "./rules";

const mockStorage = new Map<string, unknown>();

describe("Rules Module", () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();

    vi.mocked(chrome.storage.local.get).mockImplementation((key) => {
      const k = Array.isArray(key) ? key[0] : key;
      return Promise.resolve({ [k]: mockStorage.get(k) });
    });

    vi.mocked(chrome.storage.local.set).mockImplementation((obj) => {
      const key = Object.keys(obj)[0];
      mockStorage.set(key, (obj as Record<string, unknown>)[key]);
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.sync.get).mockImplementation(() =>
      Promise.resolve({
        aegis_settings: { absoluteModeDurationHours: 24 },
      }),
    );
  });

  describe("Lock System (Absolute Mode)", () => {
    it("should allow removing rules when NOT locked", async () => {
      mockStorage.set("block_rules", [{ id: 1, urlPattern: "test.com" }]);
      mockStorage.set("aegis_lock_state", { isLocked: false, unlockAt: null });

      await removeRule(1);

      const rules = mockStorage.get("block_rules");
      expect(rules).toHaveLength(0);
    });

    it("should PREVENT removing rules when locked", async () => {
      const futureTime = Date.now() + 100000;
      mockStorage.set("aegis_lock_state", {
        isLocked: true,
        unlockAt: futureTime,
      });
      mockStorage.set("block_rules", [{ id: 1, urlPattern: "test.com" }]);

      await expect(removeRule(1)).rejects.toThrow("ACTION BLOCKED");

      const rules = mockStorage.get("block_rules");
      expect(rules).toHaveLength(1);
    });

    it("should auto-unlock if time has passed", async () => {
      const pastTime = Date.now() - 1000;
      mockStorage.set("aegis_lock_state", {
        isLocked: true,
        unlockAt: pastTime,
      });

      const state = await getLockState();

      expect(state.isLocked).toBe(false);
      expect(state.unlockAt).toBeNull();
    });
  });

  describe("addRule", () => {
    it("should add a rule to storage and update Chrome DNR", async () => {
      await addRule("facebook.com");

      const rules = mockStorage.get("block_rules") as Array<{
        id?: number;
        urlPattern: string;
      }>;
      expect(rules).toHaveLength(1);
      expect(rules[0].urlPattern).toBe("facebook.com");

      expect(
        chrome.declarativeNetRequest.updateDynamicRules,
      ).toHaveBeenCalled();
    });
  });
});
