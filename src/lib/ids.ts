import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

/**
 * Booking codes are read aloud at the gate, so they use an alphabet with no
 * 0/O or 1/I/L ambiguity. They are an identifier, never a secret.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newBookingCode(): string {
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `SNR-${out}`;
}

/**
 * The QR payload. 32 random bytes is far beyond guessable, which is what makes
 * it safe to put the ticket behind a plain URL with no login.
 */
export function newTicketToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * IP addresses are personal data. We only ever need "is this the same client",
 * so we store a salted hash instead of the address itself.
 */
export function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", env.sessionSecret)
    .update(ip)
    .digest("hex")
    .slice(0, 32);
}

/** Constant-time compare that tolerates differing lengths. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
