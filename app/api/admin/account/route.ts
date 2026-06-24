import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-server";
import { controlDb } from "@/lib/control";

export const runtime = "nodejs";

/**
 * Delete the logged-in user's account: remove our copy of their profile +
 * encrypted connection keys, then delete the Supabase Auth user. Their own
 * Supabase project (documents/PDFs) stays under their control.
 */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Drop our stored row (encrypted keys + signature + connection settings).
  await controlDb.from("agencies").delete().eq("user_id", user.id);

  // Delete the auth user (controlDb holds the service-role key → admin API).
  const { error } = await controlDb.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
