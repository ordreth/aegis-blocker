import type {
  AppState,
  BlockPageConfig,
  ErrorCode,
  Rule,
  RuleInput,
  Settings,
} from "./types";

export type RulePatch = Partial<
  Pick<Rule, "kind" | "pattern" | "mode" | "enabled" | "scopes" | "schedule" | "note">
>;

export type Request =
  | { t: "state" }
  | { t: "auth.login"; password: string }
  | { t: "auth.logout" }
  | { t: "auth.setup"; password: string }
  | { t: "auth.change"; current: string; next: string }
  | { t: "auth.disable"; password: string }
  | { t: "auth.recover"; code: string }
  | { t: "rule.add"; input: RuleInput }
  | { t: "rule.addMany"; inputs: RuleInput[] }
  | { t: "rule.update"; id: string; patch: RulePatch }
  | { t: "rule.remove"; id: string }
  | { t: "rules.import"; json: string; mode: "merge" | "replace" }
  | { t: "rules.export" }
  | { t: "lock.enable"; hours?: number }
  | { t: "settings.set"; patch: Partial<Settings> }
  | { t: "blockpage.set"; config: BlockPageConfig }
  | { t: "blocked.info"; n: number; url?: string }
  | { t: "blocked.snooze"; n: number; url: string };

export interface BlockedInfo {
  pattern: string | null;
  lockUntil: number | null;
  snooze: Settings["snooze"] | null;
  /** False when the automatic redirect points at an address that is blocked right now. */
  canRedirect: boolean;
}

export interface ResponseMap {
  state: AppState;
  "auth.login": { recoveryCode?: string };
  "auth.logout": null;
  "auth.setup": { recoveryCode: string };
  "auth.change": null;
  "auth.disable": null;
  "auth.recover": null;
  "rule.add": Rule;
  "rule.addMany": { added: number; skipped: number };
  "rule.update": Rule;
  "rule.remove": null;
  "rules.import": { added: number; skipped: number };
  "rules.export": string;
  "lock.enable": { until: number };
  "settings.set": Settings;
  "blockpage.set": BlockPageConfig;
  "blocked.info": BlockedInfo;
  "blocked.snooze": null;
}

export type Reply<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; detail?: string } };

export class AegisError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, detail?: string) {
    super(detail ?? code);
    this.code = code;
  }
}
