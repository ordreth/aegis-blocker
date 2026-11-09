import { describe, expect, it } from "vitest";
import { decide, isScheduleActive, nextBoundary } from "./schedule";
import type { Rule } from "./types";

// 2026-11-09 is a Monday
const at = (h: number, m = 0, day = 9) => new Date(2026, 10, day, h, m);

const mk = (over: Partial<Rule>): Rule => ({
  id: "id-" + Math.random().toString(36).slice(2, 10),
  n: 1,
  kind: "domain",
  pattern: "example.com",
  mode: "block",
  enabled: true,
  scopes: ["url"],
  schedule: null,
  note: "",
  createdAt: 0,
  ...over,
});

describe("schedule", () => {
  const work = { days: [1, 2, 3, 4, 5], start: 9 * 60, end: 17 * 60 };
  it("is active only inside the window on selected days", () => {
    expect(isScheduleActive(work, at(10))).toBe(true);
    expect(isScheduleActive(work, at(8, 59))).toBe(false);
    expect(isScheduleActive(work, at(17))).toBe(false);
    expect(isScheduleActive(work, at(10, 0, 8))).toBe(false); // Sunday
    expect(isScheduleActive(null, at(3))).toBe(true);
  });
  it("handles overnight windows", () => {
    const night = { days: [1], start: 22 * 60, end: 6 * 60 }; // Monday night -> Tuesday morning
    expect(isScheduleActive(night, at(23))).toBe(true);
    expect(isScheduleActive(night, at(5, 0, 10))).toBe(true); // Tuesday 05:00
    expect(isScheduleActive(night, at(5, 0, 9))).toBe(false); // Monday 05:00 belongs to Sunday's window
    expect(isScheduleActive(night, at(7, 0, 10))).toBe(false);
  });
  it("finds the next boundary", () => {
    const rules = [mk({ schedule: work })];
    const next = nextBoundary(rules, at(10).getTime());
    expect(new Date(next ?? 0).getHours()).toBe(17);
    expect(nextBoundary([mk({})], Date.now())).toBeNull();
  });
});

describe("decide", () => {
  const now = at(10).getTime();
  const block = mk({ pattern: "reddit.com" });
  const allow = mk({ kind: "path", pattern: "reddit.com/r/programming", mode: "allow" });
  it("allow rules beat block rules", () => {
    expect(decide([block, allow], { url: "https://reddit.com/r/programming/x" }, now).action).toBe("allow");
    expect(decide([block, allow], { url: "https://reddit.com/r/memes" }, now).action).toBe("block");
    expect(decide([block, allow], { url: "https://example.org" }, now).action).toBe("none");
  });
  it("ignores disabled, out-of-schedule and snoozed rules", () => {
    const url = { url: "https://reddit.com/" };
    expect(decide([{ ...block, enabled: false }], url, now).action).toBe("none");
    expect(decide([{ ...block, schedule: { days: [0], start: 0, end: 60 } }], url, now).action).toBe("none");
    expect(decide([block], url, now, new Set([block.id])).action).toBe("none");
  });
});
