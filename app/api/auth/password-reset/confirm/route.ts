import { NextResponse } from "next/server";
import { hashCustomerPassword } from "@/lib/customer-auth";
import { hashOwnerPassword } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { findUsablePasswordResetToken, markPasswordResetTokenUsed } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token) {
      return NextResponse.json({ error: "Password reset link is missing." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Please use a password of at least 8 characters." }, { status: 400 });
    }

    const reset = await findUsablePasswordResetToken(token);
    if (!reset) {
      return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 400 });
    }

    if (reset.account_type === "tenant_admin") {
      const { error } = await db
        .from("tenant_users")
        .update({ password_hash: hashOwnerPassword(password) })
        .eq("id", reset.account_id)
        .eq("tenant_id", reset.tenant_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("customer_accounts")
        .update({ password_hash: hashCustomerPassword(password) })
        .eq("id", reset.account_id)
        .eq("tenant_id", reset.tenant_id);
      if (error) throw new Error(error.message);
    }

    await markPasswordResetTokenUsed(reset.id);
    return NextResponse.json({ ok: true, scope: reset.account_type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
