import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

/**
 * Authentication gate for every admin page.
 *
 * `src/proxy.ts` already blocks these routes at the edge, but this layout is
 * what actually makes them safe. Edge proxies are a hosting-platform feature:
 * their behaviour varies between providers, and Next 16's `proxy` convention
 * is new enough that a given platform's adapter may not honour it yet. If it
 * silently did not run, this page would hand every guest's name, email and
 * phone number to anyone who typed the URL.
 *
 * So the check lives here too, in the application itself, where it runs on
 * every render no matter where the app is deployed. The admin API routes
 * verify the session independently for the same reason.
 *
 * `/admin/login` sits outside this route group on purpose — gating it would
 * redirect it to itself forever.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession(
    (await cookies()).get(ADMIN_COOKIE)?.value,
  );

  if (!session) redirect("/admin/login");

  return <>{children}</>;
}
