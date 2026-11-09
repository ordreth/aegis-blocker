/** Password hashing with PBKDF2-SHA256 (WebCrypto, no dependencies). */

export const KDF_ITERATIONS = 600_000;

export interface PasswordRecord {
  kdf: "pbkdf2-sha256" | "sha256-legacy";
  iterations: number;
  salt: string;
  hash: string;
}

const toB64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

const fromB64 = (s: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

async function pbkdf2(
  secret: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
}

export async function createRecord(
  secret: string,
  iterations = KDF_ITERATIONS,
): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    kdf: "pbkdf2-sha256",
    iterations,
    salt: toB64(salt),
    hash: toB64(await pbkdf2(secret, salt, iterations)),
  };
}

/** Constant-time comparison of two equal-purpose strings. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function verifyRecord(
  secret: string,
  rec: PasswordRecord,
): Promise<boolean> {
  if (rec.kdf === "sha256-legacy") {
    // v1 stored sha256(password + salt) in hex; kept only to migrate users.
    const data = new TextEncoder().encode(secret + rec.salt);
    return safeEqual(toHex(await crypto.subtle.digest("SHA-256", data)), rec.hash);
  }
  if (rec.iterations < 1000 || rec.iterations > 5_000_000) return false;
  const out = await pbkdf2(secret, fromB64(rec.salt), rec.iterations);
  return safeEqual(toB64(out), rec.hash);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 16 chars from a 32-symbol alphabet = 80 bits, grouped 4-4-4-4. */
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let out = "";
  bytes.forEach((b, i) => {
    out += ALPHABET[b & 31];
    if (i % 4 === 3 && i !== 15) out += "-";
  });
  return out;
}

export const normalizeRecoveryCode = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, "");
