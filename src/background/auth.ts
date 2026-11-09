import {
  createRecord,
  generateRecoveryCode,
  normalizeRecoveryCode,
  verifyRecord,
} from "@/shared/crypto";
import { AegisError } from "@/shared/messages";
import type { AuthStatus } from "@/shared/types";
import {
  getAuth,
  getLockUntil,
  getSessionUntil,
  getThrottle,
  setAuth,
  setSessionUntil,
  setThrottle,
} from "./state";

const SESSION_MS = 10 * 60 * 1000;
export const MIN_PASSWORD = 8;
const MAX_SECRET = 256;

const clean = (v: unknown): string => {
  if (typeof v !== "string" || v.length === 0 || v.length > MAX_SECRET)
    throw new AegisError("invalid");
  return v;
};

export async function authStatus(): Promise<AuthStatus> {
  const [auth, until, throttle] = await Promise.all([
    getAuth(),
    getSessionUntil(),
    getThrottle(),
  ]);
  return {
    enabled: !!auth,
    unlocked: !auth || until > Date.now(),
    retryAt: throttle.until > Date.now() ? throttle.until : null,
  };
}

/** Throws unless a password is not required or the session is unlocked. Slides the session. */
export async function requireUnlocked(): Promise<void> {
  const status = await authStatus();
  if (!status.unlocked) throw new AegisError("auth_required");
  if (status.enabled) await setSessionUntil(Date.now() + SESSION_MS);
}

async function checkThrottle() {
  const t = await getThrottle();
  if (t.until > Date.now()) throw new AegisError("throttled");
  return t;
}

async function registerFailure() {
  const t = await getThrottle();
  const fails = t.fails + 1;
  const delay = fails < 5 ? 0 : Math.min(15 * 60_000, 30_000 * 2 ** (fails - 5));
  await setThrottle({ fails, until: delay ? Date.now() + delay : 0 });
}

const resetThrottle = () => setThrottle({ fails: 0, until: 0 });

async function newCredentials(password: string) {
  const code = generateRecoveryCode();
  return {
    code,
    data: {
      password: await createRecord(password),
      recovery: await createRecord(normalizeRecoveryCode(code)),
    },
  };
}

export async function login(password: unknown): Promise<{ recoveryCode?: string }> {
  const secret = clean(password);
  const auth = await getAuth();
  if (!auth) return {};
  await checkThrottle();
  if (!(await verifyRecord(secret, auth.password))) {
    await registerFailure();
    throw new AegisError("wrong_password");
  }
  await resetThrottle();
  await setSessionUntil(Date.now() + SESSION_MS);
  if (auth.password.kdf === "sha256-legacy") {
    // v1 hash: upgrade to PBKDF2 and rotate the (weakly hashed) recovery code.
    const { code, data } = await newCredentials(secret);
    await setAuth(data);
    return { recoveryCode: code };
  }
  return {};
}

export async function setup(password: unknown): Promise<{ recoveryCode: string }> {
  const secret = clean(password);
  if (secret.length < MIN_PASSWORD) throw new AegisError("weak_password");
  if (await getAuth()) throw new AegisError("forbidden");
  const { code, data } = await newCredentials(secret);
  await setAuth(data);
  await setSessionUntil(Date.now() + SESSION_MS);
  return { recoveryCode: code };
}

export async function change(current: unknown, next: unknown): Promise<void> {
  const [cur, nw] = [clean(current), clean(next)];
  if (nw.length < MIN_PASSWORD) throw new AegisError("weak_password");
  const auth = await getAuth();
  if (!auth) throw new AegisError("forbidden");
  await checkThrottle();
  if (!(await verifyRecord(cur, auth.password))) {
    await registerFailure();
    throw new AegisError("wrong_password");
  }
  await resetThrottle();
  await setAuth({ ...auth, password: await createRecord(nw) });
}

export async function disable(password: unknown): Promise<void> {
  const secret = clean(password);
  if (await getLockUntil()) throw new AegisError("locked");
  const auth = await getAuth();
  if (!auth) return;
  await checkThrottle();
  if (!(await verifyRecord(secret, auth.password))) {
    await registerFailure();
    throw new AegisError("wrong_password");
  }
  await resetThrottle();
  await setAuth(null);
  await setSessionUntil(0);
}

/** Removes the password using the recovery code. Never works during Absolute Mode. */
export async function recover(code: unknown): Promise<void> {
  const input = clean(code);
  if (await getLockUntil()) throw new AegisError("locked");
  const auth = await getAuth();
  if (!auth) return;
  await checkThrottle();
  const candidates =
    auth.recovery.kdf === "sha256-legacy"
      ? [input.toUpperCase().trim()]
      : [normalizeRecoveryCode(input)];
  let ok = false;
  for (const c of candidates) ok ||= await verifyRecord(c, auth.recovery);
  if (!ok) {
    await registerFailure();
    throw new AegisError("wrong_password");
  }
  await resetThrottle();
  await setAuth(null);
  await setSessionUntil(0);
}

export const logout = () => setSessionUntil(0);
