import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Gates the admin dashboard + admin APIs using the Supabase Auth session.
// Runs on the edge; refreshes the session cookie on each navigation.
// (Next 16 renamed the "middleware" convention to "proxy".)
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ok = !!user;

  if (pathname.startsWith("/api/admin")) {
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return res;
  }

  // Public auth pages — always pass through. The client handles post-login
  // navigation; doing it here caused redirect loops when the session is valid
  // but the agency row insert fails (e.g. wrong service-role key on first login).
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/forgot" ||
    pathname === "/admin/reset"
  ) {
    return res;
  }

  if (!ok) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
