#!/usr/bin/env node
/**
 * Generates the ADMIN_PASSWORD_HASH value for .env
 *
 *   npm run admin:hash -- "your strong password"
 *
 * The plain password is never written anywhere — only this hash goes in .env,
 * so a leaked env file does not hand over the dashboard.
 */
import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('\nUsage: npm run admin:hash -- "your password"\n');
  process.exit(1);
}

if (password.length < 10) {
  console.error(
    "\nUse at least 10 characters. This guards every attendee's contact details.\n",
  );
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password.normalize("NFKC"), salt, 64);

console.log("\nAdd these two lines to your .env file:\n");
console.log(
  `ADMIN_PASSWORD_HASH="scrypt:${salt.toString("hex")}:${derived.toString("hex")}"`,
);
console.log(`SESSION_SECRET="${crypto.randomBytes(32).toString("hex")}"`);
console.log(
  "\nKeep the quotes. Avoid $ in any .env value — env loaders expand $NAME\nand would silently corrupt it.\n",
);
