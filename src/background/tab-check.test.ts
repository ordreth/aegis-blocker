import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTabPacer } from "./tab-check";

describe("tab check pacing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("checks the first change at once", () => {
    const check = vi.fn();
    createTabPacer(check).changed(1);
    expect(check).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("answers a burst with one more check when the interval ends", () => {
    const check = vi.fn();
    const pacer = createTabPacer(check);
    for (let i = 0; i < 50; i++) pacer.changed(1);
    expect(check).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(999);
    expect(check).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(check).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(5000);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("never exceeds one check per interval under a constant flood", () => {
    const check = vi.fn();
    const pacer = createTabPacer(check);
    for (let ms = 0; ms < 10_000; ms += 10) {
      pacer.changed(1);
      vi.advanceTimersByTime(10);
    }
    expect(check.mock.calls.length).toBeLessThanOrEqual(11);
    expect(check.mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it("does not delay a navigation that comes after a quiet interval", () => {
    const check = vi.fn();
    const pacer = createTabPacer(check);
    pacer.changed(1);
    vi.advanceTimersByTime(1000);
    pacer.changed(1);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("paces each tab on its own and forgets closed tabs", () => {
    const check = vi.fn();
    const pacer = createTabPacer(check);
    pacer.changed(1);
    pacer.changed(2);
    expect(check.mock.calls).toEqual([[1], [2]]);
    pacer.changed(1);
    pacer.closed(1);
    vi.advanceTimersByTime(2000);
    expect(check).toHaveBeenCalledTimes(2);
  });
});
