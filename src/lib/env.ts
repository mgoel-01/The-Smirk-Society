import "server-only";

/**
 * Fail fast on missing configuration. A half-configured payment flow is worse
 * than a site that refuses to boot, so required secrets are asserted here and
 * this module is imported by every server entry point that needs them.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value.trim();
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
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
export const publicRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
