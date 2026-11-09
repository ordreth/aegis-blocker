import type { Rule, Schedule } from "./types";
import { ruleMatches, type MatchContext } from "./patterns";

export const DAY_MS = 86_400_000;

export function isScheduleActive(s: Schedule | null, at: Date): boolean {
  if (!s) return true;
  const minutes = at.getHours() * 60 + at.getMinutes();
  const today = at.getDay();
  if (s.start < s.end) {
    return s.days.includes(today) && minutes >= s.start && minutes < s.end;
  }
  if (s.start === s.end) return s.days.includes(today); // whole day
  // overnight window: started today (late) or yesterday (early)
  if (minutes >= s.start) return s.days.includes(today);
  return minutes < s.end && s.days.includes((today + 6) % 7);
}

export function isRuleActive(rule: Rule, at: Date): boolean {
  return rule.enabled && isScheduleActive(rule.schedule, at);
}

/** Next instant (ms) after `now` at which any schedule may flip state. */
export function nextBoundary(rules: Rule[], now: number): number | null {
  let best: number | null = null;
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  for (const r of rules) {
    if (!r.enabled || !r.schedule) continue;
    for (let d = 0; d <= 8; d++) {
      for (const minute of [r.schedule.start, r.schedule.end]) {
        const t = new Date(midnight);
        t.setDate(t.getDate() + d);
        t.setHours(0, minute, 0, 0);
        const ms = t.getTime();
        if (ms > now && (best === null || ms < best)) best = ms;
      }
    }
  }
  return best;
}

export type Decision =
  | { action: "none" }
  | { action: "allow"; rule: Rule }
  | { action: "block"; rule: Rule };

/** Allow rules win over block rules; snoozed rules are ignored. */
export function decide(
  rules: Rule[],
  ctx: MatchContext,
  now: number,
  snoozed: ReadonlySet<string> = new Set(),
): Decision {
  const at = new Date(now);
  let block: Rule | undefined;
  for (const r of rules) {
    if (snoozed.has(r.id) || !isRuleActive(r, at)) continue;
    if (!ruleMatches(r, ctx)) continue;
    if (r.mode === "allow") return { action: "allow", rule: r };
    block ??= r;
  }
  return block ? { action: "block", rule: block } : { action: "none" };
}

export const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const timeToMinutes = (v: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
};
