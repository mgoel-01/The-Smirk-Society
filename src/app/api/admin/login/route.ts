import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { adminLoginSchema } from "@/lib/validation";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  // Deliberately strict: this password guards every attendee's contact details.
  const limit = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minutes.`,
      },
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
    input = adminLoginSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Enter a password." }, { status: 400 });
    }
    throw err;
  }

  if (!verifyPassword(input.password, env.adminPasswordHash)) {
    // Same message and status for every failure — nothing to probe.
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return response;
}
