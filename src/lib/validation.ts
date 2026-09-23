import { z } from "zod";
import { MAX_QUANTITY, MIN_QUANTITY } from "./pricing";

/**
 * Every value that crosses the network is parsed here before it reaches the
 * database. Strings are trimmed and length-capped so a hostile client cannot
 * push megabytes into a column or smuggle control characters into an email.
 */

const cleanText = (max: number) =>
  z
    .string()
    .trim()
    // strip C0/C1 control characters, which have no place in a name or email
    .transform((value) => value.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""))
    .pipe(z.string().min(1).max(max));

export const nameSchema = cleanText(80)
  .refine((v) => v.length >= 2, "Please enter your full name.")
  .refine(
    (v) => /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(v),
    "Name can only contain letters, spaces, apostrophes and hyphens.",
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "That email address is too long.")
  .email("Please enter a valid email address.");

/**
 * Indian mobile numbers: 10 digits starting 6-9. We accept the shapes people
 * actually type (+91, 0 prefix, spaces, dashes) and normalise to 10 digits.
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ""))
  .transform((value) => value.replace(/^(\+91|91|0)/, ""))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  );

export const passTypeSchema = z.enum(
  ["SINGLE", "COUPLE", "GROUP4", "CHILD"],
  { message: "Please choose one of the available passes." },
);

export const createOrderSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  passType: passTypeSchema,
  quantity: z.coerce.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
  // Only meaningful for a variable-size pass; quoteFor rejects it on the
  // fixed-size ones rather than silently ignoring it.
  groupSize: z.coerce.number().int().min(1).max(50).optional(),
  // Honeypot: real users never fill a hidden field. Bots do. Accept any
  // string here so the route can recognise a bot deliberately, rather than
  // having the parse fail and look like an ordinary validation error.
  website: z.string().max(200).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Razorpay ids are opaque but well-formed; reject anything that is not. */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().regex(/^order_[A-Za-z0-9]{6,32}$/),
  razorpay_payment_id: z.string().trim().regex(/^pay_[A-Za-z0-9]{6,32}$/),
  razorpay_signature: z.string().trim().regex(/^[a-f0-9]{64}$/),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const checkInSchema = z.object({
  // Either a QR token or a typed-in booking code.
  token: z.string().trim().min(6).max(200),
});

/** Never echo raw Zod internals to the browser; return one clean message. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the details you entered.";
}
