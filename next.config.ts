import type { NextConfig } from "next";

/**
 * Content-Security-Policy is intentionally strict but must allow Razorpay's
 * checkout bundle, its iframes and its API/telemetry hosts, or payments break.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.razorpay.com",
  "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com",
  // A card payment leaves Razorpay's domain: 3-D Secure hands off to the
  // cardholder's bank, and there are hundreds of Indian bank ACS domains that
  // cannot be enumerated ahead of time. Restricting these two to Razorpay
  // would pass UPI and netbanking (which stay on Razorpay's own domain) and
  // then silently fail card payments at the bank step — the worst kind of bug
  // to discover on sale day.
  //
  // `https:` still blocks http:, data: and javascript: framing and form posts,
  // and the directives that actually stop clickjacking and script injection
  // (frame-ancestors, script-src, object-src, base-uri) stay strict.
  "frame-src https:",
  "form-action 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // `camera=(self)` is required for the gate scanner at /admin/scan.
    // The payment allow-list must include Razorpay, or its checkout frame
    // cannot use the browser's Payment Request API for saved cards.
    value:
      'geolocation=(), microphone=(), camera=(self), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")',
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // There is another package-lock.json in the parent folder, which makes
  // Next guess the wrong workspace root. Pin it to this project.
  turbopack: { root: process.cwd() },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
