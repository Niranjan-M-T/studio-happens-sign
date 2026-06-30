import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side Supabase AUTH client bound to the request cookies (via
 * @supabase/ssr). Reads/refreshes the logged-in user's session. In Server
 * Components cookie writes are no-ops (allowed only in Route Handlers /
 * Server Actions), which is fine — we only read the user there.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; the proxy
            // refreshes the session cookie on navigations.
          }
        },
      },
    },
  );
}

/**
 * The authenticated Supabase user, or null. Memoized per-request with
 * React cache() so the auth round-trip runs once even when several server
 * components / helpers ask for the user in the same request.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
