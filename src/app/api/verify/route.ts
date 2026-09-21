import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { verifyPaymentSchema } from "@/lib/validation";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { confirmRegistration } from "@/lib/booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms a payment reported by Razorpay Checkout in the browser.
 *
 * This endpoint is public, so it must assume every caller is hostile. The only
 * thing that makes a confirmation real is the HMAC signature: it is computed
 * from the order id and payment id using the API secret, which never leaves
 * the server. No signature, no ticket — regardless of what the body claims.
 *
 * The webhook at /api/webhooks/razorpay confirms the same payment independently,
 * so a buyer who closes the tab mid-redirect still gets their ticket.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`verify:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let payload;
  try {
    payload = verifyPaymentSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Payment details were malformed." },
        { status: 400 },
      );
    }
    throw err;
  }

  const signatureValid = verifyCheckoutSignature({
    orderId: payload.razorpay_order_id,
    paymentId: payload.razorpay_payment_id,
    signature: payload.razorpay_signature,
  });

  if (!signatureValid) {
    console.warn(
      `[verify] Rejected invalid signature for order ${payload.razorpay_order_id}`,
    );
    return NextResponse.json(
      { error: "We could not verify this payment. Please contact support." },
      { status: 400 },
    );
  }

  const result = await confirmRegistration({
    razorpayOrderId: payload.razorpay_order_id,
    razorpayPaymentId: payload.razorpay_payment_id,
    razorpaySignature: payload.razorpay_signature,
  });

  if (result.outcome === "not-found") {
    return NextResponse.json(
      { error: "We could not find that booking. Please contact support." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    bookingCode: result.bookingCode,
    ticketUrl: `/ticket/${result.firstTicketToken}`,
  });
}
