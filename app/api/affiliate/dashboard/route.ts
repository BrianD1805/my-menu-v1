import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildAffiliateShareUrl, normaliseAffiliateCode } from "@/lib/affiliates";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function GET(req: Request) {
  const code = normaliseAffiliateCode(req.headers.get("x-orduva-affiliate-code") || "");
  const key = String(req.headers.get("x-orduva-affiliate-key") || "").trim();
  if (!code || !key) return jsonNoStore({ error: "Affiliate session is required." }, { status: 401 });

  const { data: partner, error: partnerError } = await db
    .from("affiliate_partners")
    .select("id, display_name, email, tracking_code, access_key, status, affiliate_reward_rate_percent, tenant_reward_rate_percent")
    .eq("tracking_code", code)
    .eq("access_key", key)
    .maybeSingle();

  if (partnerError || !partner || partner.status !== "active") return jsonNoStore({ error: "Affiliate session was not recognised." }, { status: 401 });

  const { data: source } = await db.from("referral_sources").select("id").eq("referral_code", code).maybeSingle();
  const sourceId = source?.id || null;

  const [signupsResult, rewardsResult, creditsResult] = await Promise.all([
    sourceId ? db.from("referral_signups").select("id, referred_tenant_id, referral_code, status, created_at").eq("referral_source_id", sourceId).order("created_at", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    db.from("referral_rewards").select("id, referral_signup_id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, currency_code, reward_status").eq("affiliate_id", partner.id).limit(200),
    db.from("referral_reward_credits").select("id, reward_rule_id, paid_month, subscription_amount, reward_rate_percent, reward_amount, currency_code, credit_status, created_at").eq("affiliate_id", partner.id).order("created_at", { ascending: false }).limit(500),
  ]);

  if (signupsResult.error || rewardsResult.error || creditsResult.error) return jsonNoStore({ error: "Could not load affiliate revenue. Run the Ver-0.206 Supabase SQL first." }, { status: 500 });

  const rewards = rewardsResult.data || [];
  const credits = creditsResult.data || [];
  const estimatedMonthly = rewards.filter((reward) => reward.reward_status === "active").reduce((sum, reward) => sum + Number(reward.estimated_monthly_reward || 0), 0);
  const pendingAmount = credits.filter((credit) => credit.credit_status === "pending" || credit.credit_status === "credited").reduce((sum, credit) => sum + Number(credit.reward_amount || 0), 0);
  const paidAmount = credits.filter((credit) => credit.credit_status === "paid").reduce((sum, credit) => sum + Number(credit.reward_amount || 0), 0);

  return jsonNoStore({
    partner: {
      displayName: partner.display_name,
      email: partner.email,
      trackingCode: partner.tracking_code,
      shareUrl: buildAffiliateShareUrl(partner.tracking_code),
      affiliateRewardRatePercent: partner.affiliate_reward_rate_percent,
    },
    signups: signupsResult.data || [],
    rewards,
    credits,
    summary: {
      capturedSignups: (signupsResult.data || []).length,
      activeRewards: rewards.filter((reward) => reward.reward_status === "active").length,
      estimatedMonthly: Math.round(estimatedMonthly * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
    },
  });
}
