import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "./env";

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return client;
}

/**
 * Verifies the signature Razorpay Checkout hands back in the browser.
 *
 * The digest is HMAC-SHA256("<order_id>|<payment_id>") keyed with the API
 * secret, which only our server holds. Without this check a user could call
 * our verify endpoint with any payment id and claim a free ticket.
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const given = Buffer.from(params.signature, "utf8");
  const mine = Buffer.from(expected, "utf8");
  if (given.length !== mine.length) return false;
  return crypto.timingSafeEqual(given, mine);
}

/**
 * Verifies a server-to-server webhook.
 *
 * Must run against the EXACT raw request body — parsing and re-serialising
 * JSON changes byte order or spacing and the digest will not match.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  const given = Buffer.from(signature, "utf8");
  const mine = Buffer.from(expected, "utf8");
  if (given.length !== mine.length) return false;
  return crypto.timingSafeEqual(given, mine);
}
