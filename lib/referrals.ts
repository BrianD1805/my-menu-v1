import { db } from "@/lib/db";
import { calculateReferralRewardAmount, normaliseCurrency } from "@/lib/referral-rewards";
import {
  DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT,
  DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT,
  normaliseAffiliateCode,
} from "@/lib/affiliates";

export const DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT = 15;

type CaptureReferralInput = {
  referredTenantId: string;
  referredTenantSlug: string;
  refTenantSlug?: string | null;
  referralCode?: string | null;
  affiliateCode?: string | null;
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

async function getTenantCurrencyCode(tenantId: string) {
  if (!tenantId) return "GBP";
  const { data } = await db
    .from("tenant_settings")
    .select("currency_code")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return normaliseCurrency((data as { currency_code?: string | null } | null)?.currency_code, "GBP");
}

export function normalizeReferralPayload(body: Record<string, unknown> | null | undefined) {
  const refTenantSlug = normalizeSlug(body?.refTenant || body?.ref_tenant || body?.refTenantSlug || body?.ref_tenant_slug);
  const affiliateCode = normaliseAffiliateCode(body?.affiliateCode || body?.affiliate_code || body?.aff || body?.affiliate);
  const referralCode = normalizeCode(body?.ref || body?.referralCode || body?.referral_code || affiliateCode || (refTenantSlug ? `tenant_${refTenantSlug}` : ""));
  return {
    refTenantSlug: refTenantSlug || null,
    affiliateCode: affiliateCode || null,
    referralCode: referralCode || null,
    refSource: normalizeOptionalText(body?.refSource || body?.ref_source, 80) || null,
    landingUrl: normalizeOptionalText(body?.refLandingUrl || body?.ref_landing_url || body?.landingUrl || body?.landing_url, 500) || null,
  };
}

async function captureAffiliateReferral(input: CaptureReferralInput, affiliateCode: string, referralCode: string) {
  const { data: affiliate } = await db
    .from("affiliate_partners")
    .select("id, display_name, email, tracking_code, status, affiliate_reward_rate_percent, referring_tenant_id, referring_tenant_slug, tenant_reward_rate_percent")
    .eq("tracking_code", affiliateCode)
    .maybeSingle();

  if (!affiliate?.id || affiliate.status !== "active") {
    await db.from("referral_signups").insert({
      referred_tenant_id: input.referredTenantId,
      referral_code: referralCode,
      ref_tenant_slug: normalizeSlug(input.refTenantSlug),
      ref_source: normalizeOptionalText(input.refSource, 80) || "affiliate_partner",
      landing_url: normalizeOptionalText(input.landingUrl, 500),
      status: "unmatched",
      reward_rate_percent: DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT,
      metadata: {
        reason: "affiliate_not_found_or_inactive",
        affiliate_code: affiliateCode,
        client_ip: normalizeOptionalText(input.clientIp, 80),
        user_agent: normalizeOptionalText(input.userAgent, 500),
      },
    });
    return { captured: false, reason: "affiliate_not_found" };
  }

  const affiliateRate = Number(affiliate.affiliate_reward_rate_percent ?? DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT);
  const tenantRate = Number(affiliate.tenant_reward_rate_percent ?? DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT);

  const { data: source } = await db
    .from("referral_sources")
    .upsert(
      {
        referral_code: affiliateCode,
        referrer_type: "public_affiliate",
        affiliate_id: affiliate.id,
        referrer_tenant_id: null,
        display_name: affiliate.display_name || affiliate.email || affiliate.tracking_code,
        status: "active",
        reward_rate_percent: affiliateRate,
        updated_at: new Date().toISOString(),
        metadata: {
          affiliate_id: affiliate.id,
          affiliate_code: affiliateCode,
          referring_tenant_id: affiliate.referring_tenant_id || null,
          referring_tenant_slug: affiliate.referring_tenant_slug || null,
          tenant_reward_rate_percent: tenantRate,
        },
      },
      { onConflict: "referral_code" },
    )
    .select("id")
    .single();

  if (!source?.id) return { captured: false, reason: "source_not_saved" };

  const { data: signup } = await db.from("referral_signups").upsert(
    {
      referral_source_id: source.id,
      referred_tenant_id: input.referredTenantId,
      referral_code: affiliateCode,
      ref_tenant_slug: normalizeSlug(input.refTenantSlug) || affiliate.referring_tenant_slug || null,
      ref_source: normalizeOptionalText(input.refSource, 80) || "affiliate_partner",
      landing_url: normalizeOptionalText(input.landingUrl, 500),
      status: "trial",
      reward_rate_percent: affiliateRate,
      metadata: {
        affiliate_id: affiliate.id,
        affiliate_code: affiliateCode,
        referring_tenant_id: affiliate.referring_tenant_id || null,
        tenant_reward_rate_percent: tenantRate,
        client_ip: normalizeOptionalText(input.clientIp, 80),
        user_agent: normalizeOptionalText(input.userAgent, 500),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "referred_tenant_id" },
  )
    .select("id")
    .maybeSingle();

  if (signup?.id) {
    const referredTenantCurrencyCode = await getTenantCurrencyCode(input.referredTenantId);
    await db.from("referral_rewards").upsert(
      {
        referral_signup_id: signup.id,
        referral_source_id: source.id,
        affiliate_id: affiliate.id,
        referrer_type: "public_affiliate",
        referrer_tenant_id: null,
        secondary_referrer_tenant_id: affiliate.referring_tenant_id || null,
        referred_tenant_id: input.referredTenantId,
        reward_rate_percent: affiliateRate,
        monthly_subscription_amount: 0,
        estimated_monthly_reward: calculateReferralRewardAmount(0, affiliateRate),
        secondary_reward_rate_percent: tenantRate,
        secondary_estimated_monthly_reward: calculateReferralRewardAmount(0, tenantRate),
        currency_code: referredTenantCurrencyCode,
        reward_status: "trial",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "referral_signup_id" },
    );
  }

  return { captured: true, affiliateId: affiliate.id, referralSourceId: source.id, referralSignupId: signup?.id || null };
}

export async function captureTenantReferral(input: CaptureReferralInput) {
  const affiliateCode = normaliseAffiliateCode(input.affiliateCode || "");
  const referralCode = normalizeCode(input.referralCode || affiliateCode || "");

  if (affiliateCode) {
    return captureAffiliateReferral(input, affiliateCode, referralCode || affiliateCode);
  }

  const refTenantSlug = normalizeSlug(input.refTenantSlug);
  const fallbackCode = refTenantSlug ? `tenant_${refTenantSlug}` : "";
  const tenantReferralCode = normalizeCode(input.referralCode || fallbackCode);

  if (!input.referredTenantId || !tenantReferralCode || !refTenantSlug) {
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
      referral_code: tenantReferralCode,
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
        referral_code: tenantReferralCode,
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

  const { data: signup } = await db.from("referral_signups").upsert(
    {
      referral_source_id: source.id,
      referred_tenant_id: input.referredTenantId,
      referral_code: tenantReferralCode,
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
  )
    .select("id")
    .maybeSingle();

  if (signup?.id) {
    const referredTenantCurrencyCode = await getTenantCurrencyCode(input.referredTenantId);

    await db.from("referral_rewards").upsert(
      {
        referral_signup_id: signup.id,
        referral_source_id: source.id,
        referrer_tenant_id: referrerTenant.id,
        referrer_type: "tenant",
        referred_tenant_id: input.referredTenantId,
        reward_rate_percent: DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
        monthly_subscription_amount: 0,
        estimated_monthly_reward: calculateReferralRewardAmount(0, DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT),
        currency_code: referredTenantCurrencyCode,
        reward_status: "trial",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "referral_signup_id" },
    );
  }

  return { captured: true, referrerTenantId: referrerTenant.id, referralSourceId: source.id, referralSignupId: signup?.id || null };
}
