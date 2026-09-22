import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge proxy guarding /admin. (Next 16 renamed the old `middleware`
 * file convention to `proxy`; the behaviour is the same.)
 *
 * This runs on the Edge runtime, so it deliberately does not import
 * `@/lib/auth` — that module pulls in node:crypto and Prisma. Only the JWT
 * check happens here; every admin API route re-verifies the session itself,
 * so this is defence in depth rather than the sole gate.
 */
const ADMIN_COOKIE = "snr_admin";

/**
 * Inlined rather than imported from `@/lib/env`: that module is server-only
 * and pulls in node:crypto, which the Edge runtime cannot load. A secret
 * copied out of .env keeps its quotes, and a quoted key silently fails every
 * JWT check — which here would bounce a signed-in organiser back to the
 * login page forever.
 */
function unquote(value: string): string {
  const trimmed = value.trim();
  return /^(".*"|'.*')$/s.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const rawSecret = process.env.SESSION_SECRET;
  const secret = rawSecret ? unquote(rawSecret) : undefined;

  if (token && secret) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { issuer: "smirk-n-raas", audience: "admin" },
      );
      if (payload.role === "admin") return NextResponse.next();
    } catch {
      // fall through to the redirect
    }
  }

  const loginUrl = new URL("/admin/login", request.url);
  // Remember where they were headed, but only ever an internal path.
  if (pathname.startsWith("/admin/")) {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
