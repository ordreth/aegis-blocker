import { de } from "./de";
import { en, type MessageKey, type Messages } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import { zh } from "./zh";
import type { Locale, Settings } from "@/shared/types";

export type { MessageKey };

const CATALOGUES: Record<Locale, Messages> = { en, pt, es, de, zh };

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  de: "Deutsch",
  zh: "简体中文",
};

export function resolveLocale(pref: Settings["language"], browser?: string): Locale {
  if (pref !== "system") return pref;
  const lang = (browser ?? (typeof navigator !== "undefined" ? navigator.language : "en"))
    .toLowerCase()
    .split(/[-_]/)[0];
  return lang && lang in CATALOGUES ? (lang as Locale) : "en";
}

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createT(locale: Locale): TFunction {
  const dict = CATALOGUES[locale];
  return (key, vars) => {
    const msg = dict[key] ?? en[key];
    return vars ? msg.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : msg;
  };
}

export function formatDuration(ms: number, t: TFunction): string {
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `${mins} ${t("unit_m")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) {
    const rest = mins % 60;
    return rest && hours < 10 ? `${hours} ${t("unit_h")} ${rest} ${t("unit_m")}` : `${hours} ${t("unit_h")}`;
  }
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days} ${t("unit_d")} ${rest} ${t("unit_h")}` : `${days} ${t("unit_d")}`;
}
