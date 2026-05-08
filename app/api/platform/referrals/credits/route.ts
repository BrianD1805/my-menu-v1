import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";
import { normaliseCreditStatus } from "@/lib/referral-rewards";

export async function PATCH(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const creditId = String(body?.creditId || "").trim();
    if (!creditId) return NextResponse.json({ error: "Missing credit id." }, { status: 400 });

    const creditStatus = normaliseCreditStatus(body?.creditStatus);
    const paymentReference = String(body?.paymentReference || "").trim().slice(0, 200) || null;
    const notes = String(body?.notes || "").trim().slice(0, 1000) || null;

    const { data, error } = await db
      .from("referral_reward_credits")
      .update({ credit_status: creditStatus, payment_reference: paymentReference, notes, updated_at: new Date().toISOString() })
      .eq("id", creditId)
      .select("id, credit_status, payment_reference, notes, updated_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "Could not update referral credit." }, { status: 500 });
    return NextResponse.json({ ok: true, credit: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update referral credit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
