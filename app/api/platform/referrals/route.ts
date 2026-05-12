import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";
import {
  calculateReferralRewardAmount,
  monthStart,
  normaliseCreditStatus,
  normaliseCurrency,
  normaliseMoneyAmount,
  normaliseRewardRate,
  normaliseRewardStatus,
  normaliseSubscriptionPaymentSource,
  normaliseSubscriptionPaymentStatus,
} from "@/lib/referral-rewards";

type TenantRow = { id: string; name: string | null; slug: string | null; subscription_status?: string | null; trial_status?: string | null; trial_ends_at?: string | null };
type TenantSettingsRow = { tenant_id: string; currency_code: string | null; currency_symbol?: string | null };
type ReferralSourceRow = { id: string; referral_code: string | null; referrer_type: string | null; affiliate_id?: string | null; referrer_tenant_id: string | null; display_name: string | null; status: string | null; reward_rate_percent: number | null };
type ReferralSignupRow = { id: string; referral_source_id: string | null; referred_tenant_id: string | null; referral_code: string | null; ref_tenant_slug: string | null; ref_source: string | null; status: string | null; reward_rate_percent: number | null; created_at: string | null };
type ReferralRewardRow = { id: string; referral_signup_id: string | null; referral_source_id: string | null; affiliate_id?: string | null; referrer_type?: string | null; referrer_tenant_id: string | null; secondary_referrer_tenant_id?: string | null; referred_tenant_id: string | null; reward_rate_percent: number | null; monthly_subscription_amount: number | null; estimated_monthly_reward: number | null; secondary_reward_rate_percent?: number | null; secondary_estimated_monthly_reward?: number | null; currency_code: string | null; reward_status: string | null; notes: string | null; created_at: string | null; updated_at: string | null };
type ReferralCreditRow = { id: string; reward_rule_id: string | null; payment_event_id?: string | null; referral_signup_id: string | null; affiliate_id?: string | null; referrer_tenant_id: string | null; secondary_referrer_tenant_id?: string | null; referred_tenant_id: string | null; paid_month: string | null; subscription_amount: number | null; reward_rate_percent: number | null; reward_amount: number | null; secondary_reward_rate_percent?: number | null; secondary_reward_amount?: number | null; currency_code: string | null; credit_status: string | null; payment_reference: string | null; notes: string | null; created_at: string | null; updated_at: string | null };
type SubscriptionPaymentRow = { id: string; tenant_id: string | null; referral_reward_id: string | null; referral_signup_id: string | null; billing_period_month: string | null; subscription_amount: number | null; currency_code: string | null; payment_source: string | null; payment_status: string | null; payment_reference: string | null; notes: string | null; created_at: string | null; updated_at: string | null };

function safeText(value: unknown, max = 500) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

async function ensureRewardForSignup(signup: ReferralSignupRow, source: ReferralSourceRow | null, defaultCurrencyCode = "GBP") {
  if (!signup.id || !signup.referred_tenant_id) return null;
  const rewardRatePercent = normaliseRewardRate(signup.reward_rate_percent ?? source?.reward_rate_percent ?? 15);
  const referrerTenantId = source?.referrer_tenant_id || null;
  const currencyCode = normaliseCurrency(defaultCurrencyCode, "GBP");

  const { data, error } = await db
    .from("referral_rewards")
    .upsert(
      {
        referral_signup_id: signup.id,
        referral_source_id: signup.referral_source_id || source?.id || null,
        referrer_tenant_id: referrerTenantId,
        referred_tenant_id: signup.referred_tenant_id,
        reward_rate_percent: rewardRatePercent,
        estimated_monthly_reward: calculateReferralRewardAmount(0, rewardRatePercent),
        currency_code: currencyCode,
        reward_status: signup.status === "cancelled" ? "cancelled" : signup.status === "converted" || signup.status === "active_reward" ? "active" : "trial",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "referral_signup_id" },
    )
    .select("id, referral_signup_id, referral_source_id, referrer_tenant_id, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, currency_code, reward_status, notes, created_at, updated_at")
    .maybeSingle();

  if (error) return null;
  return (data as ReferralRewardRow | null) || null;
}

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const [tenantsResult, settingsResult, sourcesResult, signupsResult, rewardsResult, creditsResult, paymentsResult] = await Promise.all([
      db.from("tenants").select("id, name, slug, subscription_status, trial_status, trial_ends_at").limit(500),
      db.from("tenant_settings").select("tenant_id, currency_code, currency_symbol").limit(500),
      db.from("referral_sources").select("id, referral_code, referrer_type, affiliate_id, referrer_tenant_id, display_name, status, reward_rate_percent").limit(500),
      db.from("referral_signups").select("id, referral_source_id, referred_tenant_id, referral_code, ref_tenant_slug, ref_source, status, reward_rate_percent, created_at").order("created_at", { ascending: false }).limit(500),
      db.from("referral_rewards").select("id, referral_signup_id, referral_source_id, affiliate_id, referrer_type, referrer_tenant_id, secondary_referrer_tenant_id, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, secondary_reward_rate_percent, secondary_estimated_monthly_reward, currency_code, reward_status, notes, created_at, updated_at").limit(500),
      db.from("referral_reward_credits").select("id, reward_rule_id, payment_event_id, referral_signup_id, affiliate_id, referrer_tenant_id, secondary_referrer_tenant_id, referred_tenant_id, paid_month, subscription_amount, reward_rate_percent, reward_amount, secondary_reward_rate_percent, secondary_reward_amount, currency_code, credit_status, payment_reference, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(1000),
      db.from("tenant_subscription_payments").select("id, tenant_id, referral_reward_id, referral_signup_id, billing_period_month, subscription_amount, currency_code, payment_source, payment_status, payment_reference, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(1000),
    ]);

    if (tenantsResult.error) throw new Error("Could not load tenants.");
    if (settingsResult.error) throw new Error("Could not load tenant currency settings.");
    if (sourcesResult.error) throw new Error("Could not load referral sources.");
    if (signupsResult.error) throw new Error("Could not load referral signups.");
    if (rewardsResult.error) throw new Error("Could not load referral reward rules. Run the Ver-0.184 Supabase SQL first.");
    if (creditsResult.error) throw new Error("Could not load referral reward credits. Run the Ver-0.184 Supabase SQL first.");
    if (paymentsResult.error) throw new Error("Could not load subscription payment events. Run the Ver-0.185 Supabase SQL first.");

    const tenants = (tenantsResult.data || []) as TenantRow[];
    const settings = (settingsResult.data || []) as TenantSettingsRow[];
    const sources = (sourcesResult.data || []) as ReferralSourceRow[];
    const signups = (signupsResult.data || []) as ReferralSignupRow[];
    const rewards = (rewardsResult.data || []) as ReferralRewardRow[];
    const credits = (creditsResult.data || []) as ReferralCreditRow[];
    const payments = (paymentsResult.data || []) as SubscriptionPaymentRow[];

    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const settingsByTenantId = new Map(settings.map((setting) => [setting.tenant_id, setting]));
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const rewardBySignupId = new Map(rewards.filter((reward) => reward.referral_signup_id).map((reward) => [reward.referral_signup_id as string, reward]));
    const creditsByRewardId = new Map<string, ReferralCreditRow[]>();
    for (const credit of credits) {
      if (!credit.reward_rule_id) continue;
      const list = creditsByRewardId.get(credit.reward_rule_id) || [];
      list.push(credit);
      creditsByRewardId.set(credit.reward_rule_id, list);
    }
    const paymentsByRewardId = new Map<string, SubscriptionPaymentRow[]>();
    for (const payment of payments) {
      if (!payment.referral_reward_id) continue;
      const list = paymentsByRewardId.get(payment.referral_reward_id) || [];
      list.push(payment);
      paymentsByRewardId.set(payment.referral_reward_id, list);
    }

    const missingRewardSignups = signups.filter((signup) => signup.id && signup.referred_tenant_id && !rewardBySignupId.has(signup.id));
    const createdRewards: ReferralRewardRow[] = [];
    for (const signup of missingRewardSignups) {
      const referredCurrencyCode = normaliseCurrency(settingsByTenantId.get(signup.referred_tenant_id || "")?.currency_code, "GBP");
      const created = await ensureRewardForSignup(signup, signup.referral_source_id ? sourceById.get(signup.referral_source_id) || null : null, referredCurrencyCode);
      if (created) createdRewards.push(created);
    }
    for (const reward of createdRewards) {
      if (reward.referral_signup_id) rewardBySignupId.set(reward.referral_signup_id, reward);
    }

    // Ver-0.184A: old referral reward rows may have been created with the former GBP default.
    // If the reward has no monthly amount yet, quietly align it to the referred tenant's storefront currency.
    for (const reward of Array.from(rewardBySignupId.values())) {
      if (!reward.id || !reward.referred_tenant_id) continue;
      const referredCurrencyCode = normaliseCurrency(settingsByTenantId.get(reward.referred_tenant_id)?.currency_code, "GBP");
      const currentCurrencyCode = normaliseCurrency(reward.currency_code, "GBP");
      const hasManualMoneySetup = Number(reward.monthly_subscription_amount || 0) > 0;
      if (!hasManualMoneySetup && referredCurrencyCode && currentCurrencyCode !== referredCurrencyCode) {
        const { data: updatedReward } = await db
          .from("referral_rewards")
          .update({ currency_code: referredCurrencyCode, updated_at: new Date().toISOString() })
          .eq("id", reward.id)
          .select("id, referral_signup_id, referral_source_id, referrer_tenant_id, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, currency_code, reward_status, notes, created_at, updated_at")
          .maybeSingle();
        if (updatedReward?.referral_signup_id) rewardBySignupId.set(updatedReward.referral_signup_id, updatedReward as ReferralRewardRow);
      }
    }

    const rows = signups.map((signup) => {
      const source = signup.referral_source_id ? sourceById.get(signup.referral_source_id) || null : null;
      const reward = rewardBySignupId.get(signup.id) || null;
      const referrerTenant = source?.referrer_tenant_id ? tenantById.get(source.referrer_tenant_id) || null : null;
      const secondaryReferrerTenant = reward?.secondary_referrer_tenant_id ? tenantById.get(reward.secondary_referrer_tenant_id) || null : null;
      const referredTenant = signup.referred_tenant_id ? tenantById.get(signup.referred_tenant_id) || null : null;
      const rowCredits = reward?.id ? creditsByRewardId.get(reward.id) || [] : [];
      const rowPayments = reward?.id ? paymentsByRewardId.get(reward.id) || [] : [];
      const pendingCredits = rowCredits.filter((credit) => credit.credit_status === "pending" || credit.credit_status === "credited");
      const paidCredits = rowCredits.filter((credit) => credit.credit_status === "paid");
      const livePayments = rowPayments.filter((payment) => payment.payment_status === "paid");
      const totalPending = pendingCredits.reduce((sum, credit) => sum + Number(credit.reward_amount || 0), 0);
      const totalPaid = paidCredits.reduce((sum, credit) => sum + Number(credit.reward_amount || 0), 0);
      const totalSecondaryPending = pendingCredits.reduce((sum, credit) => sum + Number(credit.secondary_reward_amount || 0), 0);
      const totalSecondaryPaid = paidCredits.reduce((sum, credit) => sum + Number(credit.secondary_reward_amount || 0), 0);
      const totalPayments = livePayments.reduce((sum, payment) => sum + Number(payment.subscription_amount || 0), 0);
      const referredTenantCurrencyCode = normaliseCurrency(settingsByTenantId.get(signup.referred_tenant_id || "")?.currency_code, reward?.currency_code || "GBP");
      return {
        signup,
        source,
        reward,
        referrerTenant,
        secondaryReferrerTenant,
        referredTenant,
        referredTenantCurrencyCode,
        credits: rowCredits,
        payments: rowPayments,
        totals: {
          creditsCount: rowCredits.length,
          paymentsCount: rowPayments.length,
          pendingCredits: pendingCredits.length,
          paidCredits: paidCredits.length,
          pendingAmount: Math.round(totalPending * 100) / 100,
          paidAmount: Math.round(totalPaid * 100) / 100,
          secondaryPendingAmount: Math.round(totalSecondaryPending * 100) / 100,
          secondaryPaidAmount: Math.round(totalSecondaryPaid * 100) / 100,
          subscriptionPaymentsAmount: Math.round(totalPayments * 100) / 100,
        },
      };
    });

    const activeRows = rows.filter((row) => row.reward?.reward_status === "active");
    const estimatedMonthlyLiability = activeRows.reduce((sum, row) => sum + Number(row.reward?.estimated_monthly_reward || 0), 0);
    const totalPendingCredits = rows.reduce((sum, row) => sum + row.totals.pendingAmount, 0);
    const totalPaidCredits = rows.reduce((sum, row) => sum + row.totals.paidAmount, 0);
    const totalSubscriptionPayments = rows.reduce((sum, row) => sum + row.totals.subscriptionPaymentsAmount, 0);
    const uniqueReferrerTenantIds = new Set(rows.map((row) => row.referrerTenant?.id).filter(Boolean));
    const uniqueReferredTenantIds = new Set(rows.map((row) => row.referredTenant?.id).filter(Boolean));
    const totalsByCurrency: Record<string, { estimatedMonthlyLiability: number; pendingCredits: number; paidCredits: number; subscriptionPayments: number }> = {};
    for (const row of rows) {
      const currencyCode = normaliseCurrency(row.reward?.currency_code || row.referredTenantCurrencyCode || "GBP", "GBP");
      if (!totalsByCurrency[currencyCode]) {
        totalsByCurrency[currencyCode] = { estimatedMonthlyLiability: 0, pendingCredits: 0, paidCredits: 0, subscriptionPayments: 0 };
      }
      if (row.reward?.reward_status === "active") {
        totalsByCurrency[currencyCode].estimatedMonthlyLiability += Number(row.reward?.estimated_monthly_reward || 0);
      }
      totalsByCurrency[currencyCode].pendingCredits += Number(row.totals.pendingAmount || 0);
      totalsByCurrency[currencyCode].paidCredits += Number(row.totals.paidAmount || 0);
      totalsByCurrency[currencyCode].subscriptionPayments += Number(row.totals.subscriptionPaymentsAmount || 0);
    }
    for (const currencyCode of Object.keys(totalsByCurrency)) {
      totalsByCurrency[currencyCode].estimatedMonthlyLiability = Math.round(totalsByCurrency[currencyCode].estimatedMonthlyLiability * 100) / 100;
      totalsByCurrency[currencyCode].pendingCredits = Math.round(totalsByCurrency[currencyCode].pendingCredits * 100) / 100;
      totalsByCurrency[currencyCode].paidCredits = Math.round(totalsByCurrency[currencyCode].paidCredits * 100) / 100;
      totalsByCurrency[currencyCode].subscriptionPayments = Math.round(totalsByCurrency[currencyCode].subscriptionPayments * 100) / 100;
    }

    return NextResponse.json({
      rows,
      summary: {
        totalReferrals: rows.length,
        uniqueReferrers: uniqueReferrerTenantIds.size,
        uniqueReferredStores: uniqueReferredTenantIds.size,
        trialRewards: rows.filter((row) => row.reward?.reward_status === "trial").length,
        activeRewards: activeRows.length,
        pausedRewards: rows.filter((row) => row.reward?.reward_status === "paused").length,
        cancelledRewards: rows.filter((row) => row.reward?.reward_status === "cancelled").length,
        estimatedMonthlyLiability: Math.round(estimatedMonthlyLiability * 100) / 100,
        totalPendingCredits: Math.round(totalPendingCredits * 100) / 100,
        totalPaidCredits: Math.round(totalPaidCredits * 100) / 100,
        totalSubscriptionPayments: Math.round(totalSubscriptionPayments * 100) / 100,
        totalsByCurrency,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load referral rewards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const rewardId = String(body?.rewardId || "").trim();
    if (!rewardId) return NextResponse.json({ error: "Missing reward rule id." }, { status: 400 });

    const rewardRatePercent = normaliseRewardRate(body?.rewardRatePercent, 15);
    const monthlySubscriptionAmount = normaliseMoneyAmount(body?.monthlySubscriptionAmount, 0);
    const currencyCode = normaliseCurrency(body?.currencyCode, "GBP");
    const rewardStatus = normaliseRewardStatus(body?.rewardStatus);
    const notes = safeText(body?.notes, 1000);
    const estimatedMonthlyReward = calculateReferralRewardAmount(monthlySubscriptionAmount, rewardRatePercent);

    const { data, error } = await db
      .from("referral_rewards")
      .update({
        reward_rate_percent: rewardRatePercent,
        monthly_subscription_amount: monthlySubscriptionAmount,
        estimated_monthly_reward: estimatedMonthlyReward,
        currency_code: currencyCode,
        reward_status: rewardStatus,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rewardId)
      .select("id, reward_rate_percent, monthly_subscription_amount, estimated_monthly_reward, currency_code, reward_status, notes, updated_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "Could not update referral reward." }, { status: 500 });
    return NextResponse.json({ ok: true, reward: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update referral reward.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "record_subscription_payment").trim();
    if (!["record_subscription_payment", "record_monthly_credit"].includes(action)) {
      return NextResponse.json({ error: "Unsupported referral action." }, { status: 400 });
    }

    const rewardId = String(body?.rewardId || "").trim();
    if (!rewardId) return NextResponse.json({ error: "Missing reward rule id." }, { status: 400 });

    const { data: reward, error: rewardError } = await db
      .from("referral_rewards")
      .select("id, referral_signup_id, referral_source_id, affiliate_id, referrer_type, referrer_tenant_id, secondary_referrer_tenant_id, secondary_reward_rate_percent, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, currency_code, reward_status")
      .eq("id", rewardId)
      .single();

    if (rewardError || !reward) return NextResponse.json({ error: "Reward rule not found." }, { status: 404 });
    if (reward.reward_status === "cancelled") return NextResponse.json({ error: "Cancelled rewards cannot be credited." }, { status: 400 });
    if (reward.reward_status === "paused") return NextResponse.json({ error: "This referral reward is paused. Set it to active before recording a paid subscription." }, { status: 400 });
    if (!reward.referred_tenant_id) return NextResponse.json({ error: "This referral is not connected to a referred tenant yet." }, { status: 400 });

    const subscriptionAmount = normaliseMoneyAmount(body?.subscriptionAmount, reward.monthly_subscription_amount || 0);
    const rewardRatePercent = normaliseRewardRate(body?.rewardRatePercent, reward.reward_rate_percent || 15);
    const currencyCode = normaliseCurrency(body?.currencyCode, reward.currency_code || "GBP");
    const billingPeriodMonth = monthStart(body?.paidMonth || body?.billingPeriodMonth || new Date());
    const rewardAmount = calculateReferralRewardAmount(subscriptionAmount, rewardRatePercent);
    const secondaryRewardRatePercent = normaliseRewardRate(reward.secondary_reward_rate_percent || 0, 0);
    const secondaryRewardAmount = reward.secondary_referrer_tenant_id ? calculateReferralRewardAmount(subscriptionAmount, secondaryRewardRatePercent) : 0;
    const paymentSource = normaliseSubscriptionPaymentSource(body?.paymentSource || "manual");
    const paymentStatus = normaliseSubscriptionPaymentStatus(body?.paymentStatus || "paid");
    const creditStatus = normaliseCreditStatus(body?.creditStatus || "pending");
    const paymentReference = safeText(body?.paymentReference, 200);
    const notes = safeText(body?.notes, 1000);

    if (!subscriptionAmount) return NextResponse.json({ error: "Enter the monthly subscription payment amount." }, { status: 400 });
    if (!rewardAmount) return NextResponse.json({ error: "Reward amount is zero. Check the amount and percentage." }, { status: 400 });

    const { data: paymentEvent, error: paymentError } = await db
      .from("tenant_subscription_payments")
      .insert({
        tenant_id: reward.referred_tenant_id,
        referral_reward_id: reward.id,
        referral_signup_id: reward.referral_signup_id,
        billing_period_month: billingPeriodMonth,
        subscription_amount: subscriptionAmount,
        currency_code: currencyCode,
        payment_source: paymentSource,
        payment_status: paymentStatus,
        payment_reference: paymentReference,
        notes,
        metadata: { created_from: "platform_referrals", reward_rate_percent: rewardRatePercent },
      })
      .select("id, billing_period_month, subscription_amount, currency_code, payment_source, payment_status, payment_reference")
      .single();

    if (paymentError || !paymentEvent) {
      return NextResponse.json({ error: "Could not record the subscription payment. Check whether this tenant/month/source has already been recorded." }, { status: 500 });
    }

    const { data: credit, error: creditError } = await db
      .from("referral_reward_credits")
      .insert({
        reward_rule_id: reward.id,
        payment_event_id: paymentEvent.id,
        referral_signup_id: reward.referral_signup_id,
        referral_source_id: reward.referral_source_id,
        affiliate_id: reward.affiliate_id || null,
        referrer_tenant_id: reward.referrer_tenant_id,
        secondary_referrer_tenant_id: reward.secondary_referrer_tenant_id || null,
        referred_tenant_id: reward.referred_tenant_id,
        paid_month: billingPeriodMonth,
        subscription_amount: subscriptionAmount,
        reward_rate_percent: rewardRatePercent,
        reward_amount: rewardAmount,
        secondary_reward_rate_percent: secondaryRewardRatePercent,
        secondary_reward_amount: secondaryRewardAmount,
        currency_code: currencyCode,
        credit_status: creditStatus,
        payment_reference: paymentReference,
        notes,
      })
      .select("id, paid_month, subscription_amount, reward_rate_percent, reward_amount, currency_code, credit_status")
      .single();

    if (creditError || !credit) {
      await db.from("tenant_subscription_payments").update({ payment_status: "void", notes: [notes, "Referral credit was not created; likely duplicate reward month."].filter(Boolean).join(" | "), updated_at: new Date().toISOString() }).eq("id", paymentEvent.id);
      return NextResponse.json({ error: "Subscription payment was received, but the referral credit could not be created. Check for a duplicate reward month." }, { status: 500 });
    }

    await db
      .from("referral_rewards")
      .update({
        reward_status: reward.reward_status === "trial" ? "active" : reward.reward_status,
        monthly_subscription_amount: subscriptionAmount,
        reward_rate_percent: rewardRatePercent,
        estimated_monthly_reward: rewardAmount,
        secondary_estimated_monthly_reward: secondaryRewardAmount,
        currency_code: currencyCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reward.id);

    return NextResponse.json({ ok: true, paymentEvent, credit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record subscription payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
