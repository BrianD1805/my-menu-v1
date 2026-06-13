import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApiUser, hashOwnerPassword, verifyOwnerPassword } from "@/lib/admin-auth";

export async function PATCH(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const oldPassword = String(body?.oldPassword || "");
    const newPassword = String(body?.newPassword || "");
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    const { data: user } = await db
      .from("tenant_users")
      .select("id, password_hash")
      .eq("id", auth.user.id)
      .eq("tenant_id", auth.tenant.id)
      .single();
    if (!user || !verifyOwnerPassword(oldPassword, String(user.password_hash || ""))) {
      return NextResponse.json({ error: "Old password is not correct." }, { status: 400 });
    }

    const { error } = await db
      .from("tenant_users")
      .update({ password_hash: hashOwnerPassword(newPassword) })
      .eq("id", auth.user.id)
      .eq("tenant_id", auth.tenant.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to change password" }, { status: 500 });
  }
}
