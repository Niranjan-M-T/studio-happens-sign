import { NextRequest, NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import type { FieldInput, FieldType } from "@/lib/types";

export const runtime = "nodejs";

const TYPES: FieldType[] = ["signature", "name", "date", "agency_sig"];
const num01 = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;

// Replace the document's placed fields with the posted set.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;

  // In the shared hosted instance, confirm the document belongs to this agency
  // before touching its fields.
  if (ctx.scopeAgencyId) {
    const { data: owned } = await ctx.supabase
      .from("documents")
      .select("id")
      .eq("id", id)
      .eq("agency_id", ctx.scopeAgencyId)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  const body = (await req.json().catch(() => ({}))) as { fields?: FieldInput[] };
  const incoming = Array.isArray(body.fields) ? body.fields : [];

  const rows = [];
  for (const f of incoming) {
    const x = num01(f.x);
    const y = num01(f.y);
    const width = num01(f.width);
    const height = num01(f.height);
    const page = Number.isFinite(f.page) ? Math.max(0, Math.floor(f.page)) : 0;
    if (
      !TYPES.includes(f.type) ||
      x === null ||
      y === null ||
      width === null ||
      height === null
    ) {
      return NextResponse.json({ error: "Invalid field data." }, { status: 400 });
    }
    rows.push({ document_id: id, page, type: f.type, x, y, width, height });
  }

  // simplest correct strategy: clear then insert
  const { error: delErr } = await ctx.supabase
    .from("signature_fields")
    .delete()
    .eq("document_id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }
  if (rows.length > 0) {
    const { error: insErr } = await ctx.supabase
      .from("signature_fields")
      .insert(rows);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
