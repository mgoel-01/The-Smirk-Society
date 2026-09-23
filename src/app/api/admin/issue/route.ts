import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError, z } from "zod";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { createManualBooking } from "@/lib/booking";
import {
  emailSchema,
  nameSchema,
  passTypeSchema,
  phoneSchema,
  firstError,
} from "@/lib/validation";
import { MAX_QUANTITY, MIN_QUANTITY } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const issueSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  passType: passTypeSchema,
  quantity: z.coerce.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
  groupSize: z.coerce.number().int().min(1).max(50).optional(),
  paymentMethod: z.enum(["cash", "upi-direct", "bank-transfer", "complimentary"]),
});

/**
 * Issues a pass for someone who paid the organiser directly.
 *
 * This mints a valid ticket without any payment verification, so it is the
 * single most sensitive endpoint on the site: anyone who reached it could
 * create free entry. It is therefore behind the admin session, checked here
 * rather than relying only on the edge proxy, and rate limited so a stolen
 * session cannot be used to mass-produce passes unnoticed.
 */
export async function POST(request: Request) {
  const session = await verifyAdminSession(
    (await cookies()).get(ADMIN_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const ip = clientIp(request.headers);
  const limit = rateLimit(`issue:${ip}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many passes issued at once. Wait a few minutes." },
      { status: 429 },
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
    input = issueSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: firstError(err) }, { status: 400 });
    }
    throw err;
  }

  try {
    const { registration, tickets, quote } = await createManualBooking({
      ...input,
      issuedBy: "admin",
    });

    return NextResponse.json({
      ok: true,
      bookingCode: registration.bookingCode,
      passName: quote.pass.name,
      quantity: quote.quantity,
      seats: quote.seats,
      amountPaise: registration.amountPaise,
      tickets: tickets.map((t) => ({ token: t.token, seats: t.seats })),
    });
  } catch (err) {
    // quoteFor and the capacity check throw messages meant to be read.
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not issue the pass. Please try again.",
      },
      { status: 400 },
    );
  }
}
