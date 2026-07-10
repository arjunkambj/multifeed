/**
 * AES-256-GCM token encryption for connected account credentials.
 * Requires TOKEN_ENCRYPTION_KEY as 32-byte key encoded as base64 or 64-char hex.
 */

function getKeyBytes(): Uint8Array {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  }

  // hex (64 chars) or base64
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number.parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  const binary = atob(raw);
  if (binary.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const keyBytes = getKeyBytes();
  const copy = new Uint8Array(keyBytes.byteLength);
  copy.set(keyBytes);
  return crypto.subtle.importKey("raw", copy, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Returns `iv.ciphertext` base64 segments (ciphertext includes GCM tag). */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivB64, dataB64] = payload.split(".");
  if (!ivB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const key = await importKey();
  const ivRaw = base64ToBytes(ivB64);
  const dataRaw = base64ToBytes(dataB64);
  const iv = new Uint8Array(ivRaw.byteLength);
  iv.set(ivRaw);
  const data = new Uint8Array(dataRaw.byteLength);
  data.set(dataRaw);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}

export function randomUrlSafe(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return bytesToBase64(buf)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
