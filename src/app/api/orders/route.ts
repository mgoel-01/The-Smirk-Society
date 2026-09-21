import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createOrderSchema, firstError } from "@/lib/validation";
import { quoteFor } from "@/lib/pricing";
import { razorpay } from "@/lib/razorpay";
import { publicRazorpayKeyId } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/ids";
import {
  createPendingRegistration,
  releaseStalePending,
  seatsRemaining,
} from "@/lib/booking";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates a Razorpay order for a prospective booking.
 *
 * The request body carries a pass type and a quantity and nothing else that
 * touches money. The amount is looked up from the server price table, and that
 * is the figure sent to Razorpay and stored on the registration. A client that
 * posts its own price is simply ignored.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  // 8 checkout attempts per 10 minutes is generous for a real buyer and
  // tight enough to make card-testing through this endpoint impractical.
  const limit = rateLimit(`orders:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let input;
  try {
    input = createOrderSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: firstError(err) }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: the field is hidden from humans, so anything in it is a bot.
  // Answer 200 with a decoy shape so the scraper learns nothing.
  if (input.website) {
    return NextResponse.json({ error: "Unable to process." }, { status: 400 });
  }

  const quote = quoteFor(input.passType, input.quantity);

  await releaseStalePending();
  const remaining = await seatsRemaining();
  if (remaining <= 0) {
    return NextResponse.json(
      { error: "Passes are sold out. Follow us on Instagram for updates." },
      { status: 409 },
    );
  }
  if (quote.seats > remaining) {
    return NextResponse.json(
      {
        error: `Only ${remaining} ${
          remaining === 1 ? "spot is" : "spots are"
        } left — please reduce the quantity.`,
      },
      { status: 409 },
    );
  }

  try {
    const order = await razorpay().orders.create({
      amount: quote.amountPaise, // paise, computed server-side
      currency: "INR",
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        passType: quote.pass.id,
        quantity: String(quote.quantity),
        seats: String(quote.seats),
      },
    });

    const registration = await createPendingRegistration({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passType: input.passType,
      quantity: input.quantity,
      razorpayOrderId: order.id,
      ipHash: hashIp(ip),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      orderId: order.id,
      amountPaise: quote.amountPaise,
      currency: "INR",
      keyId: publicRazorpayKeyId,
      bookingCode: registration.bookingCode,
      passName: quote.pass.name,
      prefill: {
        name: input.fullName,
        email: input.email,
        contact: input.phone,
      },
    });
  } catch (err) {
    // Log the detail server-side; tell the browser nothing about internals.
    console.error("[orders] Failed to create order:", err);
    return NextResponse.json(
      { error: "We could not start the payment. Please try again." },
      { status: 502 },
    );
  }
}
