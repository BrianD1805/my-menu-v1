import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateExtendedTrialEnd, calculateTenantTrialState, DEFAULT_TRIAL_PLAN } from "@/lib/trial";

function getPlatformKey() {
  return (process.env.ORDUVA_PLATFORM_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || "").trim();
}

function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = (req.headers.get("x-orduva-platform-key") || "").trim();
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Platform access key required" }, { status: 401 });
  return null;
}

export async function POST(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = String(body?.tenantId || "").trim();
    const additionalDays = Math.max(1, Math.min(365, Math.floor(Number(body?.additionalDays || body?.days || 0))));

    if (!tenantId) return NextResponse.json({ error: "Missing tenant id" }, { status: 400 });
    if (!additionalDays) return NextResponse.json({ error: "Choose at least 1 additional trial day" }, { status: 400 });

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("id, name, slug, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const nextTrialEndsAt = calculateExtendedTrialEnd(tenant.trial_ends_at, additionalDays);
    const { data: updated, error: updateError } = await db
      .from("tenants")
      .update({
        trial_status: "active",
        trial_ends_at: nextTrialEndsAt,
        subscription_status: tenant.subscription_status === "active" ? tenant.subscription_status : "trial",
        plan_name: tenant.plan_name || DEFAULT_TRIAL_PLAN,
      })
      .eq("id", tenantId)
      .select("id, name, slug, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name")
      .single();

    if (updateError || !updated) return NextResponse.json({ error: "Could not extend trial" }, { status: 500 });

    return NextResponse.json({ ok: true, tenant: updated, trial: calculateTenantTrialState(updated), additionalDays });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
