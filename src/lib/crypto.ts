function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string,
): Promise<boolean> {
  const newHash = await hashPassword(password, salt);
  return newHash === storedHash;
}

export function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const length = 12;
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);

  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
    if ((i + 1) % 4 === 0 && i !== length - 1) code += "-";
  }
  return code;
}
