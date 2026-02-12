import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useRules from "./useRules";
import * as RulesLib from "../lib/rules";

vi.mock("../lib/rules", () => ({
  getRules: vi.fn(),
  addRule: vi.fn(),
  removeRule: vi.fn(),
}));

vi.mock("../lib/utils", () => ({
  isValidPattern: vi.fn(() => true),
  sanitizeUrl: vi.fn((url) => url),
}));

vi.mock("../lib/i18n", () => ({
  t: (k: string) => k,
}));

describe("useRules Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load rules on mount", async () => {
    const mockRules: Array<{
      id: number;
      urlPattern: string;
      matchType: "contains" | "exact";
      createdAt: number;
    }> = [
      {
        id: 1,
        urlPattern: "google.com",
        matchType: "contains",
        createdAt: 123,
      },
    ];
    vi.mocked(RulesLib.getRules).mockResolvedValue(mockRules);

    const { result } = renderHook(() => useRules());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.rules).toHaveLength(1);
    });

    expect(result.current.rules[0].urlPattern).toBe("google.com");
    expect(result.current.isLoading).toBe(false);
  });

  it("should call addRule and reload list", async () => {
    vi.mocked(RulesLib.getRules).mockResolvedValue([]);
    const { result } = renderHook(() => useRules());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleAdd("facebook.com");
    });

    expect(RulesLib.addRule).toHaveBeenCalledWith("facebook.com");
    expect(RulesLib.getRules).toHaveBeenCalledTimes(2);
  });
});
