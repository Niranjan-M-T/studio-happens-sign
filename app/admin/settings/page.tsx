import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionAgency, hostedAvailable, contextFor } from "@/lib/agency";
import { isConnected } from "@/lib/control";
import SettingsForm from "@/components/SettingsForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const STORAGE_LIMIT_BYTES = 250 * 1024 * 1024;
const SUPER_ADMIN_EMAIL = "studiohappens26@gmail.com";

export default async function SettingsPage() {
  const agency = await getSessionAgency();
  if (!agency) redirect("/admin/login");

  const connected = isConnected(agency);
  const isSuperAdmin = agency.email === SUPER_ADMIN_EMAIL;

  // Calculate storage usage for connected non-super-admin agencies.
  let usedBytes = 0;
  if (connected && !isSuperAdmin) {
    try {
      const ctx = contextFor(agency);
      let q = ctx.supabase.from("documents").select("file_size_bytes");
      if (ctx.scopeAgencyId) q = q.eq("agency_id", ctx.scopeAgencyId);
      const { data } = await q;
      usedBytes = (data ?? []).reduce(
        (sum: number, r: { file_size_bytes: number }) => sum + (r.file_size_bytes || 0),
        0,
      );
    } catch {
      // Data plane not reachable — show 0.
    }
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="font-display text-xl tracking-tight">STUDIO HAPPENS</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
              Sign · Settings
            </p>
          </div>
          <div className="flex items-center gap-5">
            {connected && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-white/60 hover:text-white"
              >
                Dashboard →
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8">
        <SettingsForm
          connected={connected}
          hostingMode={agency.hosting_mode}
          hostedAvailable={hostedAvailable()}
          email={agency.email}
          name={agency.name}
          supabaseUrl={agency.supabase_url ?? ""}
          bucket={agency.supabase_bucket}
          hasResendKey={!!agency.resend_key_enc}
          resendFrom={agency.resend_from ?? ""}
          alwaysCc={agency.always_cc ?? ""}
          signaturePng={agency.signature_png}
          usedBytes={usedBytes}
          limitBytes={isSuperAdmin ? null : STORAGE_LIMIT_BYTES}
        />
      </div>
    </main>
  );
}
