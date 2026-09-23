import "server-only";
import crypto from "node:crypto";
import { Prisma, type PassType } from "@prisma/client";
import { prisma } from "./prisma";
import { PASSES, VENUE_CAPACITY, quoteFor } from "./pricing";
import { newBookingCode, newTicketToken } from "./ids";
import { sendTicketEmail } from "./email";

/**
 * How long an unpaid checkout keeps holding its seats.
 *
 * Long enough to cover a slow UPI collect request or a bank redirect and a
 * guest who hesitates, short enough that abandoned carts do not lock up a
 * small venue. Confirmation accepts a payment that lands after this anyway.
 */
const CHECKOUT_HOLD_MS = 30 * 60 * 1000;

/**
 * Seats already committed. PENDING orders are counted too: a checkout window
 * is open for them, and overselling is far worse than briefly under-selling.
 * Stale pending orders age out via `releaseStalePending`.
 */
export async function seatsTaken(): Promise<number> {
  const result = await prisma.registration.aggregate({
    _sum: { seats: true },
    where: {
      OR: [
        { status: "PAID" },
        {
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - CHECKOUT_HOLD_MS) },
        },
      ],
    },
  });
  return result._sum.seats ?? 0;
}

export async function seatsRemaining(): Promise<number> {
  return Math.max(0, VENUE_CAPACITY - (await seatsTaken()));
}

/**
 * Marks long-abandoned checkouts as FAILED so their seats return to the pool.
 * Cheap enough to run opportunistically before each new order.
 *
 * This is a guess, not a verdict: if the payment turns out to have succeeded,
 * `confirmRegistration` claims the booking back out of FAILED.
 */
export async function releaseStalePending(): Promise<void> {
  await prisma.registration.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - CHECKOUT_HOLD_MS) },
    },
    data: { status: "FAILED", failureReason: "Checkout abandoned" },
  });
}

export type PendingBooking = {
  fullName: string;
  email: string;
  phone: string;
  passType: PassType;
  quantity: number;
  groupSize?: number;
  razorpayOrderId: string;
  ipHash?: string;
  userAgent?: string;
};

/**
 * Persists the PENDING registration that backs a freshly created Razorpay
 * order. Retries once on the (vanishingly unlikely) booking-code collision.
 */
export async function createPendingRegistration(input: PendingBooking) {
  const quote = quoteFor(input.passType, input.quantity, input.groupSize);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.registration.create({
        data: {
          bookingCode: newBookingCode(),
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passType: input.passType,
          quantity: quote.quantity,
          seats: quote.seats,
          amountPaise: quote.amountPaise,
          razorpayOrderId: input.razorpayOrderId,
          ipHash: input.ipHash,
          userAgent: input.userAgent?.slice(0, 255),
        },
      });
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes("bookingCode");
      if (!isCodeCollision) throw err;
    }
  }
  throw new Error("Could not allocate a unique booking code.");
}

export type ConfirmResult =
  | { outcome: "confirmed"; bookingCode: string; firstTicketToken: string }
  | { outcome: "already-confirmed"; bookingCode: string; firstTicketToken: string }
  | { outcome: "not-found" };

/**
 * Turns a verified payment into issued tickets.
 *
 * Idempotency is the whole point of this function. Both the browser callback
 * and the Razorpay webhook call it for the same payment, often at the same
 * moment. The conditional `updateMany` below is the gate: the database decides
 * exactly one caller wins, and only that caller mints tickets and sends the
 * email. Everyone else gets `already-confirmed`.
 */
export async function confirmRegistration(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paymentMethod?: string;
}): Promise<ConfirmResult> {
  const registration = await prisma.registration.findUnique({
    where: { razorpayOrderId: params.razorpayOrderId },
    include: { tickets: { orderBy: { createdAt: "asc" } } },
  });

  if (!registration) return { outcome: "not-found" };

  // FAILED is claimable as well as PENDING, and that matters for real money.
  // A slow UPI collect request or netbanking redirect can outlast the stale
  // sweep, which marks the booking FAILED to release its seats. If the genuine
  // payment.captured then arrived and we only accepted PENDING, the guest
  // would have paid and received nothing.
  //
  // A captured payment is authoritative, so it overrides an assumed failure.
  // PAID is still excluded — that is the guard that keeps this idempotent —
  // and so is REFUNDED, which must never silently revert to PAID.
  const claimed = await prisma.registration.updateMany({
    where: {
      id: registration.id,
      status: { in: ["PENDING", "FAILED"] },
    },
    data: {
      status: "PAID",
      failureReason: null,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
      paymentMethod: params.paymentMethod,
      paidAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    // Someone else already confirmed it, or it was refunded.
    const existing = registration.tickets[0];
    if (registration.status === "PAID" && existing) {
      return {
        outcome: "already-confirmed",
        bookingCode: registration.bookingCode,
        firstTicketToken: existing.token,
      };
    }
    return { outcome: "not-found" };
  }

  // We won the race — mint one ticket per pass purchased.
  //
  // Seats per ticket come from the booking, not the pass definition: a group
  // pass covers however many people the buyer paid for, so reading the
  // definition's default would hand a group of ten a ticket admitting four.
  const pass = PASSES[registration.passType];
  const seatsPerTicket = Math.round(
    registration.seats / registration.quantity,
  );
  await prisma.ticket.createMany({
    data: Array.from({ length: registration.quantity }, () => ({
      registrationId: registration.id,
      token: newTicketToken(),
      seats: seatsPerTicket,
    })),
  });

  const tickets = await prisma.ticket.findMany({
    where: { registrationId: registration.id },
    orderBy: { createdAt: "asc" },
    select: { token: true, seats: true },
  });

  const sent = await sendTicketEmail({
    to: registration.email,
    fullName: registration.fullName,
    bookingCode: registration.bookingCode,
    passName: pass.name,
    quantity: registration.quantity,
    seats: registration.seats,
    amountPaise: registration.amountPaise,
    tickets,
  });

  if (sent) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { emailSentAt: new Date() },
    });
  }

  return {
    outcome: "confirmed",
    bookingCode: registration.bookingCode,
    firstTicketToken: tickets[0].token,
  };
}

/** Records a failed payment attempt without disturbing a confirmed booking. */
export async function markFailed(
  razorpayOrderId: string,
  reason: string,
): Promise<void> {
  await prisma.registration.updateMany({
    where: { razorpayOrderId, status: "PENDING" },
    data: { status: "FAILED", failureReason: reason.slice(0, 255) },
  });
}

/**
 * Issues a pass for someone who paid the organiser directly — cash at the
 * door, a UPI transfer to her personally, a comped guest.
 *
 * Deliberately does NOT go through `confirmRegistration`. That function's job
 * is to turn a *verified Razorpay payment* into tickets, and its guard rails
 * assume one exists. Manual passes have no payment to verify, so they get
 * their own path rather than loosening the one that protects real money.
 *
 * The synthetic `manual_…` order id keeps the column's uniqueness intact and
 * makes these bookings obvious in an export. `paymentMethod` records how the
 * money actually arrived.
 */
export async function createManualBooking(input: {
  fullName: string;
  email: string;
  phone: string;
  passType: PassType;
  quantity: number;
  groupSize?: number;
  paymentMethod: string;
  issuedBy: string;
}) {
  const quote = quoteFor(input.passType, input.quantity, input.groupSize);

  // Manual passes still occupy seats, so they respect capacity like any other.
  await releaseStalePending();
  const remaining = await seatsRemaining();
  if (quote.seats > remaining) {
    throw new Error(
      `Only ${remaining} ${remaining === 1 ? "spot is" : "spots are"} left — cannot issue ${quote.seats}.`,
    );
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const registration = await prisma.registration.create({
        data: {
          bookingCode: newBookingCode(),
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passType: input.passType,
          quantity: quote.quantity,
          seats: quote.seats,
          amountPaise: quote.amountPaise,
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: input.paymentMethod,
          razorpayOrderId: `manual_${crypto.randomUUID()}`,
          failureReason: `Issued manually by ${input.issuedBy}`,
        },
      });

      await prisma.ticket.createMany({
        data: Array.from({ length: quote.quantity }, () => ({
          registrationId: registration.id,
          token: newTicketToken(),
          seats: quote.seatsPerPass,
        })),
      });

      const tickets = await prisma.ticket.findMany({
        where: { registrationId: registration.id },
        orderBy: { createdAt: "asc" },
        select: { token: true, seats: true },
      });

      return { registration, tickets, quote };
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes("bookingCode");
      if (!isCodeCollision) throw err;
    }
  }
  throw new Error("Could not allocate a unique booking code.");
}

/** Bookings that were started but never paid — warm leads worth chasing. */
export async function unpaidBookings(limit = 50) {
  return prisma.registration.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
