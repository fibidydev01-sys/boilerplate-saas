/**
 * Encryption helper — AES-256-GCM.
 *
 * Server-only: ENCRYPTION_KEY ada di env, gak boleh bocor ke browser.
 * Import "server-only" akan gagal compile kalau di-import dari client component.
 *
 * Format ciphertext: base64(iv || ciphertext || authTag)
 *   - iv       : 12 bytes (recommended untuk GCM)
 *   - auth tag : 16 bytes (append di belakang)
 *
 * Key rotation notes:
 *   - Kalau rotate ENCRYPTION_KEY tanpa re-encrypt row, decrypt akan fail
 *     silently (return null di caller).
 *   - Untuk rotate: decrypt semua pake key lama → encrypt ulang pake key baru.
 *   - Consider: tambah `key_version` column kalau rotation jadi kebutuhan rutin.
 */

import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY env var not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64 encoded). Got ${buf.length} bytes.`
    );
  }
  return buf;
}

/**
 * Encrypt plaintext → base64 ciphertext.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt base64 ciphertext → plaintext.
 * Throws kalau auth tag gak match (tamper detection).
 */
export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, "base64");

  if (data.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Ciphertext too short — likely corrupted");
  }

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(data.length - TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Extract last N chars dari API key untuk display hint.
 * Aman untuk di-return ke client.
 *
 * @example
 *   getKeyHint("lsk_abc123xyz9")  // "********xyz9"
 */
export function getKeyHint(apiKey: string, chars = 4): string {
  if (apiKey.length <= chars) return "*".repeat(apiKey.length);
  const maskLen = Math.min(8, apiKey.length - chars);
  return "*".repeat(maskLen) + apiKey.slice(-chars);
}
