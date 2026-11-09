import { parseInput } from "@/shared/patterns";
import { sanitizeRules, sanitizeSettings } from "@/shared/schema";
import type { Locale, Settings } from "@/shared/types";
import { getAuth, getVersion, K, setAuth, setLockUntil, setRules, setSettings, setVersion } from "./state";

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

/**
 * Imports v1 data (rules, lock, settings, password) and deletes the old keys,
 * including chrome.storage.sync. It can be run again after an interruption: each
 * step only fills in what is still missing, and a v1 copy is deleted only after
 * it has been read. Resolves to true while there was still something to do.
 */
export async function migrate(): Promise<boolean> {
  if ((await getVersion()) >= 2) return false;

  const local = await chrome.storage.local.get(["block_rules", "aegis_lock_state", K.rules, K.settings]);

  const v1Rules = Array.isArray(local.block_rules) ? (local.block_rules as V1Rule[]) : [];
  const converted = v1Rules.flatMap((r) => {
    if (typeof r.urlPattern !== "string") return [];
    const p = parseInput(r.urlPattern);
    return p.ok ? [{ kind: p.kind, pattern: p.pattern }] : [];
  });
  const rules = sanitizeRules(converted);
  if (rules.length && !(K.rules in local)) await setRules(rules);

  const lock = local.aegis_lock_state as V1Lock | undefined;
  if (lock?.isLocked && typeof lock.unlockAt === "number" && lock.unlockAt > Date.now()) {
    await setLockUntil(lock.unlockAt);
  }
  await chrome.storage.local.remove(["block_rules", "aegis_lock_state"]);

  // The password and the settings lived in chrome.storage.sync. When it cannot be
  // read, "there was no password" is not a safe conclusion: leave the old data where
  // it is and finish on a later start of the worker.
  let sync: { aegis_settings?: V1Settings; aegis_security_config?: V1Security };
  try {
    sync = await chrome.storage.sync.get(["aegis_settings", "aegis_security_config"]);
  } catch (err) {
    console.warn("Aegis: v1 settings are not readable yet, will retry", err);
    return true;
  }

  const old = sync.aegis_settings;
  if (old && !(K.settings in local)) {
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

  const sec = sync.aegis_security_config;
  if (sec?.isEnabled && sec.passwordHash && sec.salt && sec.recoveryHash && !(await getAuth())) {
    await setAuth({
      password: { kdf: "sha256-legacy", iterations: 0, salt: sec.salt, hash: sec.passwordHash },
      recovery: { kdf: "sha256-legacy", iterations: 0, salt: sec.salt, hash: sec.recoveryHash },
    });
  }

  await chrome.storage.sync.clear();
  await setVersion();
  return true;
}
