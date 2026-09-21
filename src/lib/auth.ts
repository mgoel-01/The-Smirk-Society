import "server-only";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

export const ADMIN_COOKIE = "snr_admin";
const SESSION_HOURS = 8;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.sessionSecret);
}

/**
 * Passwords are stored as `scrypt:<salt-hex>:<hash-hex>`. scrypt is memory-hard,
 * so a leaked hash is expensive to brute-force. Generate one with:
 *   npm run admin:hash -- "your password"
 *
 * The separator is a colon, not the `$` of a standard PHC string, on purpose:
 * dotenv-style loaders (including Next's) expand `$NAME` inside .env values,
 * which would silently truncate a `$`-delimited hash to "scrypt" and lock the
 * dashboard out permanently. Colons survive that intact.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password.normalize("NFKC"), salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = crypto.scryptSync(
    password.normalize("NFKC"),
    salt,
    expected.length,
  );
  // Constant-time: never leak how much of the hash matched.
  return crypto.timingSafeEqual(derived, expected);
}

export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("smirk-n-raas")
    .setAudience("admin")
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "smirk-n-raas",
      audience: "admin",
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export const adminCookieOptions = {
  httpOnly: true, // not readable by JavaScript, so XSS cannot steal it
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // blocks cross-site form CSRF against /admin
  path: "/",
  maxAge: SESSION_HOURS * 60 * 60,
};
