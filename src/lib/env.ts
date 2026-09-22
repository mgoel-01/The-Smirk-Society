import "server-only";

/**
 * Fail fast on missing configuration. A half-configured payment flow is worse
 * than a site that refuses to boot, so required secrets are asserted here and
 * this module is imported by every server entry point that needs them.
 */
/**
 * Values in `.env` are written with surrounding quotes, and people copy them
 * from there straight into a hosting dashboard. Those dashboards store the
 * quotes literally, so the value arrives as `"scrypt:..."` instead of
 * `scrypt:...` — which fails in ways that look nothing like a quoting bug.
 * Strip one matching pair so a pasted value behaves the same either way.
 */
function clean(raw: string): string {
  const trimmed = raw.trim();
  const quoted =
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")));
  return quoted ? trimmed.slice(1, -1).trim() : trimmed;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || clean(value) === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return clean(value);
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const cleaned = clean(value);
  return cleaned === "" ? undefined : cleaned;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get razorpayKeyId() {
    return required("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return required("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return required("RAZORPAY_WEBHOOK_SECRET");
  },
  get sessionSecret() {
    const secret = required("SESSION_SECRET");
    if (secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters.");
    }
    return secret;
  },
  get adminPasswordHash() {
    return required("ADMIN_PASSWORD_HASH");
  },
  get siteUrl() {
    return (
      optional("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") ??
      "http://localhost:3000"
    );
  },
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  get emailFrom() {
    return optional("EMAIL_FROM") ?? "Smirk Society <onboarding@resend.dev>";
  },
  get supportEmail() {
    return optional("SUPPORT_EMAIL") ?? "joinsmirksociety@gmail.com";
  },
} as const;

/** Public Razorpay key id — safe to expose, it is the publishable half. */
export const publicRazorpayKeyId = clean(
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
);
