import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Protects the admin dashboard and admin APIs. Runs on the edge;
// only uses jose (edge-safe) to verify the session JWT.
// (Next 16 renamed the "middleware" convention to "proxy".)
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Auth endpoints (signup/login/logout) must stay open.
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  const ok = await verifySessionToken(token);

  if (pathname.startsWith("/api/admin")) {
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  // Public auth pages: login + signup. Logged-in users skip them.
  if (pathname === "/admin/login" || pathname === "/admin/signup") {
    return ok ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!ok) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
