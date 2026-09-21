import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmRegistration, markFailed } from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay server-to-server webhook — the safety net for the whole payment
 * flow. If a buyer's browser dies between paying and hitting /api/verify, this
 * is what still issues their ticket.
 *
 * Three rules make it trustworthy:
 *  1. Verify the HMAC against the RAW body. Parsing first and re-serialising
 *     changes the bytes and the digest will never match.
 *  2. Never trust the payload before the signature passes.
 *  3. Be idempotent. Razorpay retries on any non-2xx, and will happily deliver
 *     the same event more than once; the event id table makes replays no-ops.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook] Rejected payload with a bad signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          method?: string;
          error_description?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventType = event.event ?? "unknown";
  // Razorpay sends a stable id per delivery; fall back to a composite key.
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `${eventType}:${event.payload?.payment?.entity?.id ?? "none"}`;

  // Claim the event. A duplicate delivery trips the primary key and we stop.
  try {
    await prisma.webhookEvent.create({ data: { id: eventId, eventType } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }

  const payment = event.payload?.payment?.entity;

  try {
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        if (!payment?.order_id || !payment?.id) break;
        const result = await confirmRegistration({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          paymentMethod: payment.method,
        });
        if (result.outcome === "not-found") {
          // A payment we have no record of. Log loudly for manual follow-up,
          // but still 200 so Razorpay stops retrying a message we cannot use.
          console.error(
            `[webhook] No registration for order ${payment.order_id} (payment ${payment.id}).`,
          );
        }
        break;
      }

      case "payment.failed": {
        if (!payment?.order_id) break;
        await markFailed(
          payment.order_id,
          payment.error_description ?? "Payment failed",
        );
        break;
      }

      default:
        // Unhandled event types are acknowledged so they are not retried.
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${eventType}:`, err);
    // Release the idempotency claim so Razorpay's retry can do real work.
    await prisma.webhookEvent.delete({ where: { id: eventId } }).catch(() => {});
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
