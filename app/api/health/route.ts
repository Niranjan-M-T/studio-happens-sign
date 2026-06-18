import { NextResponse } from "next/server";

// Lightweight liveness endpoint for an external uptime pinger
// (UptimeRobot / cron-job.org) to keep the Render free instance awake.
// Intentionally does no DB/storage work so it returns instantly.
export const runtime = "edge";

export function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
