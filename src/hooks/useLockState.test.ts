import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useLockState from "./useLockState";
import * as RulesLib from "../lib/rules";

vi.mock("../lib/rules", () => ({
  getLockState: vi.fn(),
  enableLock: vi.fn(),
}));

describe("useLockState Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize as unlocked", async () => {
    vi.mocked(RulesLib.getLockState).mockResolvedValue({
      isLocked: false,
      unlockAt: null,
    });

    const { result } = renderHook(() => useLockState());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.timeLeft).toBe("");
  });

  it("should update timeLeft correctly when locked", async () => {
    const now = Date.now();
    const unlockAt = now + 1000 * 60 * 60;

    vi.mocked(RulesLib.getLockState).mockResolvedValue({
      isLocked: true,
      unlockAt: unlockAt,
    });

    const { result } = renderHook(() => useLockState());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.timeLeft).toContain("h");

    vi.setSystemTime(now + 1000 * 60 * 30);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000 * 60 * 30);
    });
  });
});
