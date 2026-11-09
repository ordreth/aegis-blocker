export type RuleKind = "domain" | "path" | "keyword" | "regex";
export type RuleMode = "block" | "allow";
export type RuleScope = "url" | "title";

/** Active window. `days` uses Date#getDay (0 = Sunday); times are minutes since midnight. */
export interface Schedule {
  days: number[];
  start: number;
  end: number;
}

export interface Rule {
  /** Stable public id (uuid). */
  id: string;
  /** Stable numeric id, used as declarativeNetRequest rule id. */
  n: number;
  kind: RuleKind;
  pattern: string;
  mode: RuleMode;
  enabled: boolean;
  scopes: RuleScope[];
  schedule: Schedule | null;
  note: string;
  createdAt: number;
}

export type RuleInput = Pick<Rule, "kind" | "pattern"> &
  Partial<Pick<Rule, "mode" | "enabled" | "scopes" | "schedule" | "note">>;

export type Locale = "en" | "pt" | "es" | "de" | "zh";
export type ThemePref = "system" | "light" | "dark";

export interface Settings {
  theme: ThemePref;
  language: "system" | Locale;
  confirmDelete: boolean;
  lockHours: number;
  snooze: { enabled: boolean; waitSeconds: number; minutes: number };
}

export interface LockState {
  until: number;
}

export type BlockTheme =
  | "aegis"
  | "midnight"
  | "paper"
  | "forest"
  | "ocean"
  | "sunset"
  | "mono"
  | "custom";

export interface BlockPageConfig {
  title: string;
  message: string;
  quotes: string[];
  showQuote: boolean;
  rotateQuotes: boolean;
  theme: BlockTheme;
  colors: { bg: string; card: string; text: string; accent: string };
  layout: "card" | "center" | "split";
  shape: "soft" | "sharp" | "pill";
  icon: "shield" | "lock" | "flame" | "leaf" | "eye" | "none";
  font: "sans" | "serif" | "mono";
  background: {
    kind: "none" | "image" | "video";
    mediaId: string | null;
    overlay: number;
    blur: number;
  };
  showUrl: boolean;
  showRule: boolean;
  showLockTimer: boolean;
  buttons: { label: string; url: string }[];
  redirect: { enabled: boolean; url: string; delaySec: number };
}

export interface AuthStatus {
  enabled: boolean;
  unlocked: boolean;
  retryAt: number | null;
}

/** Snapshot sent to UI pages. `rules` is null while the vault is locked. */
export interface AppState {
  auth: AuthStatus;
  lockUntil: number | null;
  settings: Settings;
  rules: Rule[] | null;
  blockPage: BlockPageConfig;
  now: number;
}

export type ErrorCode =
  | "locked"
  | "auth_required"
  | "invalid"
  | "invalid_host"
  | "invalid_regex"
  | "unsafe_regex"
  | "too_broad"
  | "too_long"
  | "empty"
  | "limit"
  | "duplicate"
  | "throttled"
  | "wrong_password"
  | "weak_password"
  | "not_found"
  | "unsupported_regex"
  | "bad_import"
  | "bad_media"
  | "unsafe_url"
  | "redirect_loop"
  | "forbidden"
  | "internal";
