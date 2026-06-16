import { randomBytes } from "crypto";

/** URL-safe, unguessable token for a signing link (~32 chars). */
export function generateSignToken(): string {
  return randomBytes(24).toString("base64url");
}
