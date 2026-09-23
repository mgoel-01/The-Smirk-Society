/**
 * Authoritative price table. The browser sends only a pass type and a
 * quantity; every rupee figure is derived here on the server. This is the
 * single most important rule in the payment flow — a client that posts its own
 * amount must never be believed.
 */
import type { PassType } from "@prisma/client";

export type PassDefinition = {
  id: PassType;
  name: string;
  /** Total price for one pass, in paise. */
  pricePaise: number;
  /** People admitted by one pass. */
  seats: number;
  perPersonPaise: number;
  badge?: string;
  blurb: string;
  /**
   * When set, the buyer chooses how many people the pass covers and the price
   * scales per head. Without it the pass has a fixed size.
   */
  sizeRange?: { min: number; max: number };
};

export const PASSES: Record<PassType, PassDefinition> = {
  SINGLE: {
    id: "SINGLE",
    name: "Solo Pass",
    pricePaise: 85_000, // ₹850
    seats: 1,
    perPersonPaise: 85_000,
    blurb: "Entry for one person.",
  },
  COUPLE: {
    id: "COUPLE",
    name: "Couple Entry",
    pricePaise: 150_000, // ₹1,500
    seats: 2,
    perPersonPaise: 75_000, // ₹750 each
    badge: "Most popular",
    blurb: "Entry for two, at ₹750 per person.",
  },
  GROUP4: {
    id: "GROUP4",
    name: "Group of 4 or More",
    pricePaise: 280_000, // ₹2,800 for the minimum group of four
    seats: 4,
    perPersonPaise: 70_000, // ₹700 each
    badge: "Best value",
    blurb: "Four or more, at ₹700 per person.",
    sizeRange: { min: 4, max: 20 },
  },
  CHILD: {
    id: "CHILD",
    name: "Child Pass",
    pricePaise: 45_000, // ₹450
    seats: 1,
    perPersonPaise: 45_000,
    badge: "Ages 6-12",
    blurb: "Entry for one child aged 6 to 12.",
  },
};

export const PASS_LIST: PassDefinition[] = [
  PASSES.SINGLE,
  PASSES.COUPLE,
  PASSES.GROUP4,
  PASSES.CHILD,
];

/**
 * Only tell visitors how many spots are left once it is genuinely scarce.
 * Above this, the number is withheld entirely rather than merely hidden —
 * see the note in src/app/register/page.tsx.
 */
export const LOW_STOCK_THRESHOLD = 40;

/** Guard rails: one booking cannot monopolise the venue. */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
/** Total people one booking may cover, across quantity and group size. */
export const MAX_SEATS_PER_BOOKING = 40;

/**
 * Total capacity in people. Orders are refused once confirmed seats hit this.
 *
 * Parsed defensively: a value pasted from `.env` may arrive wrapped in quotes,
 * and `Number('"500"')` is NaN — which would silently disable the capacity
 * check entirely, since every comparison against NaN is false. Fall back to a
 * safe number rather than overselling the venue.
 */
function parseCapacity(raw: string | undefined): number {
  if (!raw) return 500;
  const parsed = Number(raw.trim().replace(/^["']|["']$/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

export const VENUE_CAPACITY = parseCapacity(process.env.VENUE_CAPACITY);

export function quoteFor(
  passType: PassType,
  quantity: number,
  groupSize?: number,
) {
  const pass = PASSES[passType];
  if (!pass) throw new Error(`Unknown pass type: ${passType}`);
  if (!Number.isInteger(quantity)) {
    throw new Error("Quantity must be a whole number.");
  }
  if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new Error(
      `Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`,
    );
  }

  // How many people a single pass of this type covers.
  let seatsPerPass = pass.seats;
  let amountPerPass = pass.pricePaise;

  if (pass.sizeRange) {
    const size = groupSize ?? pass.seats;
    if (!Number.isInteger(size)) {
      throw new Error("Group size must be a whole number.");
    }
    if (size < pass.sizeRange.min || size > pass.sizeRange.max) {
      throw new Error(
        `A group must be between ${pass.sizeRange.min} and ${pass.sizeRange.max} people.`,
      );
    }
    seatsPerPass = size;
    amountPerPass = size * pass.perPersonPaise;
  } else if (groupSize !== undefined && groupSize !== pass.seats) {
    // A fixed-size pass must never be talked into covering more people.
    throw new Error("This pass covers a fixed number of people.");
  }

  const seats = seatsPerPass * quantity;
  if (seats > MAX_SEATS_PER_BOOKING) {
    throw new Error(
      `One booking can cover at most ${MAX_SEATS_PER_BOOKING} people. Please split it.`,
    );
  }

  return {
    pass,
    quantity,
    seatsPerPass,
    seats,
    amountPaise: amountPerPass * quantity,
  };
}

/** ₹85,000 paise -> "₹850". Indian digit grouping, no trailing decimals. */
export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
