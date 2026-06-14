import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT } from "@/lib/affiliates";
import { DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT } from "@/lib/referrals";
import { normaliseCurrency } from "@/lib/referral-rewards";

type ReferralSourceRow = {
  id: string;
  referral_code: string | null;
  referrer_type: string | null;
  referrer_tenant_id: string | null;
  display_name: string | null;
  status: string | null;
  reward_rate_percent: number | null;
};

type ReferralSignupRow = {
  id: string;
  referral_source_id: string | null;
  referred_tenant_id: string | null;
  referral_code: string | null;
  ref_tenant_slug: string | null;
  ref_source: string | null;
  status: string | null;
  reward_rate_percent: number | null;
  created_at: string | null;
};

type TenantRow = { id: string; name: string | null; slug: string | null; subscription_status: string | null; trial_status: string | null };
type SettingsRow = { tenant_id: string; currency_code: string | null; currency_symbol: string | null };

type ReferralRewardRow = {
  id: string;
  referral_signup_id: string | null;
  referrer_tenant_id: string | null;
  referred_tenant_id: string | null;
  affiliate_id?: string | null;
  secondary_referrer_tenant_id?: string | null;
  reward_rate_percent: number | null;
  secondary_reward_rate_percent?: number | null;
  monthly_subscription_amount: number | null;
  estimated_monthly_reward: number | null;
  secondary_estimated_monthly_reward?: number | null;
  currency_code: string | null;
  reward_status: string | null;
  updated_at: string | null;
};

type ReferralCreditRow = {
  id: string;
  reward_rule_id: string | null;
  referral_signup_id: string | null;
  referrer_tenant_id: string | null;
  referred_tenant_id: string | null;
  affiliate_id?: string | null;
  secondary_referrer_tenant_id?: string | null;
  reward_amount: number | null;
  secondary_reward_amount?: number | null;
  currency_code: string | null;
  credit_status: string | null;
  paid_month: string | null;
  created_at: string | null;
};

type AffiliateApplicationRow = {
  id: string;
  applicant_name: string | null;
  email: string | null;
  payout_currency_code: string | null;
  earning_region: string | null;
  status: string | null;
  created_at: string | null;
};

type AffiliatePartnerRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  tracking_code: string | null;
  status: string | null;
  tenant_reward_rate_percent: number | null;
  created_at: string | null;
};

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function buildTenantReferralCode(slug: string) {
  return `tenant_${slug}`.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildTenantReferralUrl(slug: string, code: string) {
  const params = new URLSearchParams({ ref_tenant: slug, ref: code, ref_source: "tenant_admin" });
  return `https://www.orduva.com/?${params.toString()}`;
}

function buildTenantAffiliateApplicationUrl(slug: string) {
  const params = new URLSearchParams({ ref_tenant: slug, ref_source: "tenant_admin_affiliate" });
  return `https://www.orduva.com/affiliate/apply?${params.toString()}`;
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) map.set(row.id, row);
  return Array.from(map.values());
}

function sumCurrency(rows: Array<{ currency_code: string | null; amount: number }>) {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const currency = normaliseCurrency(row.currency_code, "GBP");
    totals[currency] = Math.round(((totals[currency] || 0) + Number(row.amount || 0)) * 100) / 100;
  }
  return totals;
}

export async function GET(req: Request) {
  const session = await requireAdminApiUser(req);
  if ("error" in session) return session.error;

  const tenant = session.tenant;
  const slug = String(tenant.slug || "").trim().toLowerCase();
  if (!slug) return jsonNoStore({ error: "Store address is unavailable." }, { status: 400 });

  try {
    const referralCode = buildTenantReferralCode(slug);
    const [settingsResult, sourceResult] = await Promise.all([
      db.from("tenant_settings").select("tenant_id, currency_code, currency_symbol").eq("tenant_id", tenant.id).maybeSingle(),
      db.from("referral_sources").select("id, referral_code, referrer_type, referrer_tenant_id, display_name, status, reward_rate_percent").eq("referrer_type", "tenant").eq("referrer_tenant_id", tenant.id).maybeSingle(),
    ]);

    if (settingsResult.error) throw new Error("Could not load tenant currency settings.");
    if (sourceResult.error && sourceResult.error.code !== "PGRST116") throw new Error("Could not load tenant referral source.");

    const settings = (settingsResult.data || null) as SettingsRow | null;
    const source = (sourceResult.data || null) as ReferralSourceRow | null;

    const signupQueries = [
      source?.id
        ? db.from("referral_signups").select("id, referral_source_id, referred_tenant_id, referral_code, ref_tenant_slug, ref_source, status, reward_rate_percent, created_at").eq("referral_source_id", source.id).limit(300)
        : Promise.resolve({ data: [], error: null }),
      db.from("referral_signups").select("id, referral_source_id, referred_tenant_id, referral_code, ref_tenant_slug, ref_source, status, reward_rate_percent, created_at").eq("ref_tenant_slug", slug).limit(300),
    ];

    const [sourceSignupsResult, slugSignupsResult, tenantRewardsResult, affiliateRewardsResult, tenantCreditsResult, affiliateCreditsResult, applicationsResult, partnersResult] = await Promise.all([
      signupQueries[0],
      signupQueries[1],
      db.from("referral_rewards").select("id, referral_signup_id, referrer_tenant_id, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, currency_code, reward_status, updated_at").eq("referrer_tenant_id", tenant.id).limit(300),
      db.from("referral_rewards").select("id, referral_signup_id, affiliate_id, secondary_referrer_tenant_id, secondary_reward_rate_percent, monthly_subscription_amount, secondary_estimated_monthly_reward, currency_code, reward_status, updated_at").eq("secondary_referrer_tenant_id", tenant.id).limit(300),
      db.from("referral_reward_credits").select("id, reward_rule_id, referral_signup_id, referrer_tenant_id, referred_tenant_id, reward_amount, currency_code, credit_status, paid_month, created_at").eq("referrer_tenant_id", tenant.id).limit(500),
      db.from("referral_reward_credits").select("id, reward_rule_id, referral_signup_id, affiliate_id, secondary_referrer_tenant_id, secondary_reward_amount, currency_code, credit_status, paid_month, created_at").eq("secondary_referrer_tenant_id", tenant.id).limit(500),
      db.from("affiliate_applications").select("id, applicant_name, email, payout_currency_code, earning_region, status, created_at").or(`referring_tenant_id.eq.${tenant.id},ref_tenant_slug.eq.${slug}`).order("created_at", { ascending: false }).limit(200),
      db.from("affiliate_partners").select("id, display_name, email, tracking_code, status, tenant_reward_rate_percent, created_at").or(`referring_tenant_id.eq.${tenant.id},referring_tenant_slug.eq.${slug}`).order("created_at", { ascending: false }).limit(200),
    ]);

    if (sourceSignupsResult.error || slugSignupsResult.error) throw new Error("Could not load tenant referral signups.");
    if (tenantRewardsResult.error) throw new Error("Could not load tenant referral rewards. Run the referral Supabase SQL first.");
    if (affiliateRewardsResult.error) throw new Error("Could not load affiliate introduction rewards. Run the Ver-0.206 Supabase SQL first.");
    if (tenantCreditsResult.error) throw new Error("Could not load tenant referral credits. Run the referral Supabase SQL first.");
    if (affiliateCreditsResult.error) throw new Error("Could not load affiliate introduction credits. Run the Ver-0.206 Supabase SQL first.");
    if (applicationsResult.error) throw new Error("Could not load affiliate applications. Run the Ver-0.206 Supabase SQL first.");
    if (partnersResult.error) throw new Error("Could not load affiliate partners. Run the Ver-0.206 Supabase SQL first.");

    const allSignups = uniqueById([...(sourceSignupsResult.data || []), ...(slugSignupsResult.data || [])] as ReferralSignupRow[]).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    const affiliateSignups = allSignups.filter((signup) => signup.ref_source === "affiliate_partner");
    const signups = allSignups.filter((signup) => signup.ref_source !== "affiliate_partner");
    const referredTenantIds = Array.from(new Set(allSignups.map((signup) => signup.referred_tenant_id).filter(Boolean) as string[]));
    const tenantsResult = referredTenantIds.length
      ? await db.from("tenants").select("id, name, slug, subscription_status, trial_status").in("id", referredTenantIds)
      : { data: [], error: null };
    if (tenantsResult.error) throw new Error("Could not load referred stores.");

    const tenantById = new Map(((tenantsResult.data || []) as TenantRow[]).map((row) => [row.id, row]));
    const rewards = (tenantRewardsResult.data || []) as ReferralRewardRow[];
    const affiliateRewards = (affiliateRewardsResult.data || []) as ReferralRewardRow[];
    const credits = (tenantCreditsResult.data || []) as ReferralCreditRow[];
    const affiliateCredits = (affiliateCreditsResult.data || []) as ReferralCreditRow[];
    const applications = (applicationsResult.data || []) as AffiliateApplicationRow[];
    const partners = (partnersResult.data || []) as AffiliatePartnerRow[];
    const affiliateRewardBySignupId = new Map(affiliateRewards.filter((reward) => reward.referral_signup_id).map((reward) => [reward.referral_signup_id as string, reward]));
    const affiliateRewardByTenantId = new Map(affiliateRewards.filter((reward) => reward.referred_tenant_id).map((reward) => [reward.referred_tenant_id as string, reward]));
    const defaultTenantAffiliateShare = partners[0]?.tenant_reward_rate_percent ?? DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT;

    const tenantEstimated = rewards.map((reward) => ({ currency_code: reward.currency_code, amount: Number(reward.estimated_monthly_reward || 0) }));
    const tenantPendingCredits = credits.filter((credit) => credit.credit_status === "pending" || credit.credit_status === "credited").map((credit) => ({ currency_code: credit.currency_code, amount: Number(credit.reward_amount || 0) }));
    const tenantPaidCredits = credits.filter((credit) => credit.credit_status === "paid").map((credit) => ({ currency_code: credit.currency_code, amount: Number(credit.reward_amount || 0) }));

    const affiliateEstimated = affiliateRewards.map((reward) => ({ currency_code: reward.currency_code, amount: Number(reward.secondary_estimated_monthly_reward || 0) }));
    const affiliatePendingCredits = affiliateCredits.filter((credit) => credit.credit_status === "pending" || credit.credit_status === "credited").map((credit) => ({ currency_code: credit.currency_code, amount: Number(credit.secondary_reward_amount || 0) }));
    const affiliatePaidCredits = affiliateCredits.filter((credit) => credit.credit_status === "paid").map((credit) => ({ currency_code: credit.currency_code, amount: Number(credit.secondary_reward_amount || 0) }));

    return jsonNoStore({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug,
        currencyCode: normaliseCurrency(settings?.currency_code, "GBP"),
        currencySymbol: settings?.currency_symbol || null,
      },
      links: {
        tenantReferralCode: source?.referral_code || referralCode,
        tenantReferralUrl: buildTenantReferralUrl(slug, source?.referral_code || referralCode),
        affiliateApplicationUrl: buildTenantAffiliateApplicationUrl(slug),
      },
      source: source || {
        id: null,
        referral_code: referralCode,
        referrer_type: "tenant",
        referrer_tenant_id: tenant.id,
        display_name: tenant.name || slug,
        status: "ready",
        reward_rate_percent: DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
      },
      signups: signups.map((signup) => {
        const referred = signup.referred_tenant_id ? tenantById.get(signup.referred_tenant_id) : null;
        return {
          id: signup.id,
          referralCode: signup.referral_code,
          status: signup.status,
          refSource: signup.ref_source,
          createdAt: signup.created_at,
          rewardRatePercent: signup.reward_rate_percent ?? source?.reward_rate_percent ?? DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
          referredStore: referred ? { id: referred.id, name: referred.name, slug: referred.slug, subscriptionStatus: referred.subscription_status, trialStatus: referred.trial_status } : null,
        };
      }),
      affiliateSignups: affiliateSignups.map((signup) => {
        const referred = signup.referred_tenant_id ? tenantById.get(signup.referred_tenant_id) : null;
        const reward = affiliateRewardBySignupId.get(signup.id) || (signup.referred_tenant_id ? affiliateRewardByTenantId.get(signup.referred_tenant_id) : null);
        return {
          id: signup.id,
          referralCode: signup.referral_code,
          status: signup.status,
          refSource: signup.ref_source,
          createdAt: signup.created_at,
          tenantRewardRatePercent: reward?.secondary_reward_rate_percent ?? defaultTenantAffiliateShare,
          referredStore: referred ? { id: referred.id, name: referred.name, slug: referred.slug, subscriptionStatus: referred.subscription_status, trialStatus: referred.trial_status } : null,
        };
      }),
      applications,
      partners: partners.map((partner) => ({ ...partner, shareUrl: partner.tracking_code ? `https://www.orduva.com/?aff=${encodeURIComponent(partner.tracking_code)}&ref=${encodeURIComponent(partner.tracking_code)}&ref_source=affiliate_partner` : null })),
      summaries: {
        tenantReferral: {
          signupCount: signups.length,
          trialCount: signups.filter((signup) => (signup.status || "trial") === "trial").length,
          activeRewardCount: rewards.filter((reward) => reward.reward_status === "active").length,
          rewardRatePercent: source?.reward_rate_percent ?? DEFAULT_TENANT_REFERRAL_REWARD_RATE_PERCENT,
          estimatedByCurrency: sumCurrency(tenantEstimated),
          pendingByCurrency: sumCurrency(tenantPendingCredits),
          paidByCurrency: sumCurrency(tenantPaidCredits),
        },
        affiliateIntroductions: {
          applicationCount: applications.length,
          pendingApplicationCount: applications.filter((application) => application.status === "pending").length,
          approvedPartnerCount: partners.filter((partner) => partner.status === "active").length,
          tenantRewardRatePercent: defaultTenantAffiliateShare,
          estimatedByCurrency: sumCurrency(affiliateEstimated),
          pendingByCurrency: sumCurrency(affiliatePendingCredits),
          paidByCurrency: sumCurrency(affiliatePaidCredits),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load tenant referral dashboard.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
