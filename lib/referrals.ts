import { db } from "@/lib/db";

export const DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT = 15;

type CaptureReferralInput = {
  referredTenantId: string;
  referredTenantSlug: string;
  refTenantSlug?: string | null;
  referralCode?: string | null;
  refSource?: string | null;
  landingUrl?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

function normalizeSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeCode(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

export function normalizeReferralPayload(body: Record<string, unknown> | null | undefined) {
  const refTenantSlug = normalizeSlug(body?.refTenant || body?.ref_tenant || body?.refTenantSlug || body?.ref_tenant_slug);
  const referralCode = normalizeCode(body?.ref || body?.referralCode || body?.referral_code || (refTenantSlug ? `tenant_${refTenantSlug}` : ""));
  return {
    refTenantSlug: refTenantSlug || null,
    referralCode: referralCode || null,
    refSource: normalizeOptionalText(body?.refSource || body?.ref_source, 80) || null,
    landingUrl: normalizeOptionalText(body?.refLandingUrl || body?.ref_landing_url || body?.landingUrl || body?.landing_url, 500) || null,
  };
}

export async function captureTenantReferral(input: CaptureReferralInput) {
  const refTenantSlug = normalizeSlug(input.refTenantSlug);
  const fallbackCode = refTenantSlug ? `tenant_${refTenantSlug}` : "";
  const referralCode = normalizeCode(input.referralCode || fallbackCode);

  if (!input.referredTenantId || !referralCode || !refTenantSlug) {
    return { captured: false, reason: "missing_referral" };
  }

  if (normalizeSlug(input.referredTenantSlug) === refTenantSlug) {
    return { captured: false, reason: "self_referral" };
  }

  const { data: referrerTenant } = await db
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", refTenantSlug)
    .maybeSingle();

  if (!referrerTenant?.id) {
    await db.from("referral_signups").insert({
      referred_tenant_id: input.referredTenantId,
      referral_code: referralCode,
      ref_tenant_slug: refTenantSlug,
      ref_source: normalizeOptionalText(input.refSource, 80),
      landing_url: normalizeOptionalText(input.landingUrl, 500),
      status: "unmatched",
      reward_rate_percent: DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
      metadata: {
        reason: "referrer_tenant_not_found",
        client_ip: normalizeOptionalText(input.clientIp, 80),
        user_agent: normalizeOptionalText(input.userAgent, 500),
      },
    });
    return { captured: false, reason: "referrer_not_found" };
  }

  const { data: source } = await db
    .from("referral_sources")
    .upsert(
      {
        referral_code: referralCode,
        referrer_type: "tenant",
        referrer_tenant_id: referrerTenant.id,
        display_name: referrerTenant.name || referrerTenant.slug,
        status: "active",
        reward_rate_percent: DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "referral_code" },
    )
    .select("id")
    .single();

  if (!source?.id) {
    return { captured: false, reason: "source_not_saved" };
  }

  await db.from("referral_signups").upsert(
    {
      referral_source_id: source.id,
      referred_tenant_id: input.referredTenantId,
      referral_code: referralCode,
      ref_tenant_slug: refTenantSlug,
      ref_source: normalizeOptionalText(input.refSource, 80),
      landing_url: normalizeOptionalText(input.landingUrl, 500),
      status: "trial",
      reward_rate_percent: DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
      metadata: {
        client_ip: normalizeOptionalText(input.clientIp, 80),
        user_agent: normalizeOptionalText(input.userAgent, 500),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "referred_tenant_id" },
  );

  return { captured: true, referrerTenantId: referrerTenant.id, referralSourceId: source.id };
}
