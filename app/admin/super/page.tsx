import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionAgency, clientFor } from "@/lib/agency";
import { controlDb } from "@/lib/control";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "studiohappens26@gmail.com";

async function getStats() {
  const now = new Date();
  const ago = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString();

  // Signup counts (all agencies except super admin)
  const { data: signups } = await controlDb
    .from("agencies")
    .select("created_at, hosting_mode, supabase_url, supabase_key_enc")
    .neq("email", SUPER_ADMIN_EMAIL);

  const all = signups ?? [];

  const counts = {
    lifetime: all.length,
    year: all.filter((a) => a.created_at >= ago(365)).length,
    ytd: all.filter((a) => a.created_at >= new Date(now.getFullYear(), 0, 1).toISOString()).length,
    month: all.filter((a) => a.created_at >= ago(30)).length,
    week: all.filter((a) => a.created_at >= ago(7)).length,
    today: all.filter((a) => a.created_at >= ago(1)).length,
  };

  const modes = {
    hosted: all.filter((a) => a.hosting_mode === "hosted").length,
    byo_connected: all.filter(
      (a) => a.hosting_mode === "byo" && a.supabase_url && a.supabase_key_enc,
    ).length,
    byo_pending: all.filter(
      (a) => a.hosting_mode === "byo" && (!a.supabase_url || !a.supabase_key_enc),
    ).length,
  };

  // Recent signups
  const { data: recent } = await controlDb
    .from("agencies")
    .select("id, name, email, hosting_mode, created_at")
    .neq("email", SUPER_ADMIN_EMAIL)
    .order("created_at", { ascending: false })
    .limit(20);

  // Per-agency storage stats for hosted-mode agencies.
  type AgencyStorageRow = { agencyId: string; name: string; email: string; docCount: number; usedBytes: number };
  const hostedStorage: AgencyStorageRow[] = [];

  const hostedUrl = process.env.HOSTED_SUPABASE_URL;
  const hostedKey = process.env.HOSTED_SUPABASE_SERVICE_KEY;
  if (hostedUrl && hostedKey) {
    try {
      const hostedDb = clientFor(hostedUrl, hostedKey);
      const { data: docRows } = await hostedDb
        .from("documents")
        .select("agency_id, file_size_bytes");

      const { data: hostedAgencies } = await controlDb
        .from("agencies")
        .select("id, name, email")
        .eq("hosting_mode", "hosted")
        .neq("email", SUPER_ADMIN_EMAIL);

      const byAgency = new Map<string, { count: number; bytes: number }>();
      for (const row of docRows ?? []) {
        if (!row.agency_id) continue;
        const cur = byAgency.get(row.agency_id) ?? { count: 0, bytes: 0 };
        cur.count += 1;
        cur.bytes += row.file_size_bytes || 0;
        byAgency.set(row.agency_id, cur);
      }

      for (const a of hostedAgencies ?? []) {
        const s = byAgency.get(a.id) ?? { count: 0, bytes: 0 };
        hostedStorage.push({ agencyId: a.id, name: a.name, email: a.email, docCount: s.count, usedBytes: s.bytes });
      }
      hostedStorage.sort((a, b) => b.usedBytes - a.usedBytes);
    } catch {
      // Hosted DB unavailable — skip.
    }
  }

  return { counts, modes, recent: recent ?? [], hostedStorage };
}

export default async function SuperAdminPage() {
  const agency = await getSessionAgency();
  if (!agency) redirect("/admin/login");
  if (agency.email !== SUPER_ADMIN_EMAIL) redirect("/admin");

  const { counts, modes, recent, hostedStorage } = await getStats();

  const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-5";

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="font-display text-xl tracking-tight">STUDIO HAPPENS</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
              Sign · Super Admin
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-sm font-semibold text-white/60 hover:text-white">
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8">

        {/* Signups over time */}
        <section className={card}>
          <h2 className="text-lg font-semibold">Agency signups</h2>
          <p className="mt-1 text-sm text-white/50">Excludes your own account.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Today", value: counts.today },
              { label: "This week", value: counts.week },
              { label: "This month", value: counts.month },
              { label: "YTD", value: counts.ytd },
              { label: "Last 365 days", value: counts.year },
              { label: "All time", value: counts.lifetime },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hosting mode breakdown */}
        <section className={card}>
          <h2 className="text-lg font-semibold">Database connections</h2>
          <p className="mt-1 text-sm text-white/50">
            How agencies are storing their documents.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-3xl font-bold text-emerald-300">{modes.hosted}</p>
              <p className="mt-1 text-xs text-white/50">Studio Happens hosting</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-3xl font-bold">{modes.byo_connected}</p>
              <p className="mt-1 text-xs text-white/50">BYO connected</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-3xl font-bold text-accent-bright">{modes.byo_pending}</p>
              <p className="mt-1 text-xs text-white/50">Not yet connected</p>
            </div>
          </div>
        </section>

        {/* Recent signups table */}
        <section className={card}>
          <h2 className="text-lg font-semibold">Recent signups</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">No other agencies have signed up yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="pb-2 pr-4 font-medium">Agency</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Mode</th>
                    <th className="pb-2 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {recent.map((a) => (
                    <tr key={a.id} className="text-white/70">
                      <td className="py-2.5 pr-4 font-medium text-white">{a.name}</td>
                      <td className="py-2.5 pr-4">{a.email}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            a.hosting_mode === "hosted"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {a.hosting_mode === "hosted" ? "Hosted" : "BYO"}
                        </span>
                      </td>
                      <td className="py-2.5 text-white/40">
                        {new Date(a.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Hosted agency storage */}
        {hostedStorage.length > 0 && (
          <section className={card}>
            <h2 className="text-lg font-semibold">Hosted agency storage</h2>
            <p className="mt-1 text-sm text-white/50">
              250 MB limit per agency · auto-delete after 30 days.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="pb-2 pr-4 font-medium">Agency</th>
                    <th className="pb-2 pr-4 font-medium">Docs</th>
                    <th className="pb-2 pr-4 font-medium">Used</th>
                    <th className="pb-2 font-medium w-40">Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {hostedStorage.map((a) => {
                    const pct = Math.min(Math.round((a.usedBytes / (250 * 1024 * 1024)) * 100), 100);
                    const barColor = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
                    return (
                      <tr key={a.agencyId} className="text-white/70">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-white">{a.name}</p>
                          <p className="text-xs text-white/40">{a.email}</p>
                        </td>
                        <td className="py-2.5 pr-4">{a.docCount}</td>
                        <td className="py-2.5 pr-4 text-xs">
                          {(a.usedBytes / 1024 / 1024).toFixed(1)} MB
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-white/40">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="text-xs text-white/30">
          BYO agencies store docs in their own Supabase — storage shown only for hosted-mode agencies above.
        </p>
      </div>
    </main>
  );
}
