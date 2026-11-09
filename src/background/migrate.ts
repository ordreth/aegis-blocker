import { parseInput } from "@/shared/patterns";
import { DEFAULT_BLOCK_PAGE, sanitizeRules, sanitizeSettings } from "@/shared/schema";
import type { Locale, Settings } from "@/shared/types";
import {
  getVersion,
  setAuth,
  setBlockPage,
  setLockUntil,
  setRules,
  setSettings,
  setVersion,
} from "./state";

interface V1Rule {
  urlPattern?: unknown;
}
interface V1Settings {
  theme?: string;
  language?: string;
  doubleCheckDelete?: boolean;
  absoluteModeDurationHours?: number;
}
interface V1Security {
  isEnabled?: boolean;
  passwordHash?: string;
  salt?: string;
  recoveryHash?: string;
}
interface V1Lock {
  isLocked?: boolean;
  unlockAt?: number | null;
}

const LANG: Record<string, Locale> = { en: "en", pt: "pt", es: "es", de: "de", zh_CN: "zh", zh: "zh" };

/** Imports v1 data (rules, lock, settings, password) and wipes the old keys, including chrome.storage.sync. */
export async function migrate(): Promise<void> {
  if ((await getVersion()) >= 2) return;

  const [oldLocal, oldSync] = await Promise.all([
    chrome.storage.local.get(["block_rules", "aegis_lock_state"]),
    chrome.storage.sync.get(["aegis_settings", "aegis_security_config"]).catch(() => ({})),
  ]);

  const v1Rules = Array.isArray(oldLocal.block_rules) ? (oldLocal.block_rules as V1Rule[]) : [];
  const converted = v1Rules.flatMap((r) => {
    if (typeof r.urlPattern !== "string") return [];
    const p = parseInput(r.urlPattern);
    return p.ok ? [{ kind: p.kind, pattern: p.pattern }] : [];
  });
  const rules = sanitizeRules(converted);
  if (rules.length) await setRules(rules);

  const lock = oldLocal.aegis_lock_state as V1Lock | undefined;
  if (lock?.isLocked && typeof lock.unlockAt === "number" && lock.unlockAt > Date.now()) {
    await setLockUntil(lock.unlockAt);
  }

  const old = (oldSync as { aegis_settings?: V1Settings }).aegis_settings;
  if (old) {
    const settings: Partial<Settings> = {
      confirmDelete: old.doubleCheckDelete,
      lockHours: old.absoluteModeDurationHours,
      ...(old.theme === "light" || old.theme === "dark" || old.theme === "system"
        ? { theme: old.theme }
        : {}),
      language: old.language ? (LANG[old.language] ?? "system") : "system",
    };
    await setSettings(sanitizeSettings(settings));
  }

  const sec = (oldSync as { aegis_security_config?: V1Security }).aegis_security_config;
  if (sec?.isEnabled && sec.passwordHash && sec.salt && sec.recoveryHash) {
    await setAuth({
      password: { kdf: "sha256-legacy", iterations: 0, salt: sec.salt, hash: sec.passwordHash },
      recovery: { kdf: "sha256-legacy", iterations: 0, salt: sec.salt, hash: sec.recoveryHash },
    });
  }

  await setBlockPage(structuredClone(DEFAULT_BLOCK_PAGE));
  await chrome.storage.local.remove(["block_rules", "aegis_lock_state"]);
  await chrome.storage.sync.clear().catch(() => undefined);
  await setVersion();
}
