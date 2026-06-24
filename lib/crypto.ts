import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

/**
 * AES-256-GCM encryption for agency secrets at rest (Supabase service-role
 * key, Resend key). A database dump alone can't reveal them — an attacker
 * also needs ENCRYPTION_KEY, which lives only in the server environment.
 *
 * Stored format (base64):  iv(12) | authTag(16) | ciphertext
 */

const IV_LEN = 12; // GCM standard nonce length
const TAG_LEN = 16;

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes, base64-encoded " +
        '(generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))").',
    );
  }
  return buf;
}

/** Encrypt a plaintext secret → base64 string safe to store in the DB. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/** Decrypt a value produced by encryptSecret. Throws if tampered/invalid. */
export function decryptSecret(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
