import crypto from "crypto";
import { db } from "@/lib/db";
import {
  BillingInterval,
  PricingCurrencyCode,
  PricingPlanCode,
  normalisePricingCurrencyCode,
  normalisePricingPlanCode,
  priceForPlan,
} from "@/lib/pricing";
import {
  calculateReferralRewardAmount,
  monthStart,
  normaliseCurrency,
  normaliseMoneyAmount,
  normaliseRewardRate,
} from "@/lib/referral-rewards";
import { normaliseBillingInterval, planCodeFromTenantPlanName } from "@/lib/stripe-checkout";

export type StripeWebhookProcessResult = {
  ok: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  message: string;
};

type StripeEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data?: { object?: Record<string, any> };
};

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAndParseStripeWebhook(rawBody: string, signatureHeader: string | null): StripeEvent {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured. Add STRIPE_WEBHOOK_SECRET in Netlify environment variables.");
  }
  if (!signatureHeader) throw new Error("Missing Stripe signature header.");

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error("Invalid Stripe signature header.");

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (!timingSafeEqualText(expected, signature)) {
    throw new Error("Stripe webhook signature verification failed.");
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  if (!event?.id || !event?.type) throw new Error("Invalid Stripe webhook event payload.");
  return event;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getStripeObject(event: StripeEvent) {
  return (event.data?.object || {}) as Record<string, any>;
}

function mergeMetadata(...values: Array<Record<string, any> | undefined | null>) {
  return values.reduce<Record<string, string>>((acc, value) => {
    if (!value || typeof value !== "object") return acc;
    for (const [key, raw] of Object.entries(value)) {
      const text = getString(raw);
      if (text && !acc[key]) acc[key] = text;
    }
    return acc;
  }, {});
}

function checkoutMetadata(object: Record<string, any>) {
  return mergeMetadata(object.metadata);
}

function invoiceMetadata(object: Record<string, any>) {
  return mergeMetadata(
    object.metadata,
    object.subscription_details?.metadata,
    object.parent?.subscription_details?.metadata,
    object.lines?.data?.[0]?.metadata,
    object.lines?.data?.[0]?.price?.metadata,
  );
}

function subscriptionMetadata(object: Record<string, any>) {
  return mergeMetadata(object.metadata);
}

function stripeMajorAmountFromMinor(amountMinor: unknown) {
  const parsed = Number(amountMinor);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round((parsed / 100) * 100) / 100;
}

function amountFromMetadataOrInvoice(metadata: Record<string, string>, object: Record<string, any>) {
  const planCode = normalisePricingPlanCode(metadata.plan_code || metadata.plan || "starter") as PricingPlanCode;
  const currencyCode = normalisePricingCurrencyCode(metadata.currency_code || object.currency || "ZAR") as PricingCurrencyCode;
  const billingInterval = normaliseBillingInterval(metadata.billing_interval || metadata.billing || "monthly") as BillingInterval;

  if (metadata.plan_code || metadata.currency_code || metadata.billing_interval) {
    return {
      amount: priceForPlan(planCode, currencyCode, billingInterval),
      planCode,
      currencyCode,
      billingInterval,
    };
  }

  return {
    amount: stripeMajorAmountFromMinor(object.amount_paid ?? object.amount_due ?? object.total ?? object.amount),
    planCode,
    currencyCode,
    billingInterval,
  };
}

function billingMonthFromInvoice(object: Record<string, any>) {
  const periodStartSeconds =
    object.lines?.data?.[0]?.period?.start ||
    object.period_start ||
    object.created ||
    Math.floor(Date.now() / 1000);
  const date = new Date(Number(periodStartSeconds) * 1000);
  return monthStart(date);
}

async function findTenant(input: { tenantId?: string; subscriptionId?: string; customerId?: string }) {
  if (input.tenantId) {
    const { data } = await db
      .from("tenants")
      .select("id, slug, name, plan_name, billing_customer_id, billing_subscription_id")
      .eq("id", input.tenantId)
      .maybeSingle();
    if (data) return data as any;
  }

  if (input.subscriptionId) {
    const { data } = await db
      .from("tenants")
      .select("id, slug, name, plan_name, billing_customer_id, billing_subscription_id")
      .eq("billing_subscription_id", input.subscriptionId)
      .maybeSingle();
    if (data) return data as any;
  }

  if (input.customerId) {
    const { data } = await db
      .from("tenants")
      .select("id, slug, name, plan_name, billing_customer_id, billing_subscription_id")
      .eq("billing_customer_id", input.customerId)
      .maybeSingle();
    if (data) return data as any;
  }

  return null;
}

async function markTenantActive(input: {
  tenantId: string;
  customerId?: string;
  subscriptionId?: string;
  planCode?: string;
  billingInterval?: string;
  currencyCode?: string;
}) {
  const planCode = normalisePricingPlanCode(input.planCode || "starter");
  const billingInterval = normaliseBillingInterval(input.billingInterval || "monthly");
  const currencyCode = normalisePricingCurrencyCode(input.currencyCode || "ZAR");
  const update: Record<string, any> = {
    subscription_status: "active",
    trial_status: "converted",
    plan_name: `${planCode}_${billingInterval}_stripe`,
    billing_provider: "stripe",
  };
  if (input.customerId) update.billing_customer_id = input.customerId;
  if (input.subscriptionId) update.billing_subscription_id = input.subscriptionId;
  update.billing_metadata = { plan_code: planCode, billing_interval: billingInterval, currency_code: currencyCode };

  // billing_metadata may not exist on older databases. Fall back cleanly if Supabase rejects it.
  const { error } = await db.from("tenants").update(update).eq("id", input.tenantId);
  if (error) {
    delete update.billing_metadata;
    await db.from("tenants").update(update).eq("id", input.tenantId);
  }
}

async function loadReferralRewardForTenant(tenantId: string) {
  const { data } = await db
    .from("referral_rewards")
    .select("id, referral_signup_id, referral_source_id, referrer_tenant_id, referred_tenant_id, reward_rate_percent, monthly_subscription_amount, currency_code, reward_status")
    .eq("referred_tenant_id", tenantId)
    .maybeSingle();
  return data as any | null;
}

async function recordTenantSubscriptionPayment(input: {
  tenantId: string;
  amount: number;
  currencyCode: string;
  billingPeriodMonth: string;
  paymentReference: string;
  sourceEventId: string;
  planCode: string;
  billingInterval: string;
  customerId?: string;
  subscriptionId?: string;
}) {
  const reward = await loadReferralRewardForTenant(input.tenantId);
  const currencyCode = normaliseCurrency(input.currencyCode, "GBP");
  const amount = normaliseMoneyAmount(input.amount, 0);

  const existingPayment = input.paymentReference
    ? await db
        .from("tenant_subscription_payments")
        .select("id, billing_period_month, subscription_amount, currency_code, payment_status")
        .eq("payment_source", "stripe")
        .eq("payment_reference", input.paymentReference)
        .maybeSingle()
    : null;

  if (existingPayment && !existingPayment.error && existingPayment.data) {
    return { paymentEvent: existingPayment.data, credit: null, duplicatePayment: true };
  }

  const { data: paymentEvent, error: paymentError } = await db
    .from("tenant_subscription_payments")
    .insert({
      tenant_id: input.tenantId,
      referral_reward_id: reward?.id || null,
      referral_signup_id: reward?.referral_signup_id || null,
      billing_period_month: input.billingPeriodMonth,
      subscription_amount: amount,
      currency_code: currencyCode,
      payment_source: "stripe",
      payment_status: "paid",
      payment_reference: input.paymentReference,
      notes: "Created automatically from Stripe invoice.paid webhook.",
      metadata: {
        stripe_event_id: input.sourceEventId,
        stripe_customer_id: input.customerId || null,
        stripe_subscription_id: input.subscriptionId || null,
        plan_code: input.planCode,
        billing_interval: input.billingInterval,
      },
    })
    .select("id, billing_period_month, subscription_amount, currency_code, payment_source, payment_status, payment_reference")
    .single();

  if (paymentError || !paymentEvent) {
    throw new Error("Could not record Stripe subscription payment. It may already exist for this tenant/month/source.");
  }

  if (!reward || reward.reward_status === "cancelled" || reward.reward_status === "paused") {
    return { paymentEvent, credit: null, duplicatePayment: false };
  }

  const rewardRatePercent = normaliseRewardRate(reward.reward_rate_percent, 15);
  const rewardAmount = calculateReferralRewardAmount(amount, rewardRatePercent);
  if (!rewardAmount) return { paymentEvent, credit: null, duplicatePayment: false };

  const { data: credit, error: creditError } = await db
    .from("referral_reward_credits")
    .insert({
      reward_rule_id: reward.id,
      payment_event_id: paymentEvent.id,
      referral_signup_id: reward.referral_signup_id,
      referral_source_id: reward.referral_source_id,
      referrer_tenant_id: reward.referrer_tenant_id,
      referred_tenant_id: reward.referred_tenant_id,
      paid_month: input.billingPeriodMonth,
      subscription_amount: amount,
      reward_rate_percent: rewardRatePercent,
      reward_amount: rewardAmount,
      currency_code: currencyCode,
      credit_status: "pending",
      payment_reference: input.paymentReference,
      notes: "Created automatically from Stripe subscription payment.",
      metadata: {
        stripe_event_id: input.sourceEventId,
        stripe_customer_id: input.customerId || null,
        stripe_subscription_id: input.subscriptionId || null,
      },
    })
    .select("id, paid_month, subscription_amount, reward_rate_percent, reward_amount, currency_code, credit_status")
    .single();

  if (creditError || !credit) {
    return { paymentEvent, credit: null, duplicatePayment: false };
  }

  await db
    .from("referral_rewards")
    .update({
      reward_status: reward.reward_status === "trial" ? "active" : reward.reward_status,
      monthly_subscription_amount: amount,
      reward_rate_percent: rewardRatePercent,
      estimated_monthly_reward: rewardAmount,
      currency_code: currencyCode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reward.id);

  return { paymentEvent, credit, duplicatePayment: false };
}

async function startWebhookEvent(event: StripeEvent) {
  const { data, error } = await db
    .from("stripe_webhook_events")
    .insert({
      id: event.id,
      event_type: event.type,
      livemode: Boolean(event.livemode),
      status: "processing",
      payload: event as any,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (String((error as any).code || "") === "23505") return false;
    // If the SQL has not been run, fail loudly rather than silently accepting webhooks.
    throw new Error("Could not record Stripe webhook event. Run the Ver-0.191 Supabase SQL first.");
  }
  return Boolean(data);
}

async function finishWebhookEvent(eventId: string, status: "processed" | "ignored" | "failed", message?: string) {
  await db
    .from("stripe_webhook_events")
    .update({
      status,
      error_message: status === "failed" ? message || "Webhook processing failed." : null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function handleCheckoutCompleted(event: StripeEvent) {
  const object = getStripeObject(event);
  const metadata = checkoutMetadata(object);
  const tenantId = getString(metadata.tenant_id || object.client_reference_id);
  const customerId = getString(object.customer);
  const subscriptionId = getString(object.subscription);
  if (!tenantId) throw new Error("Stripe checkout session completed without tenant_id metadata.");
  await markTenantActive({
    tenantId,
    customerId,
    subscriptionId,
    planCode: metadata.plan_code,
    billingInterval: metadata.billing_interval,
    currencyCode: metadata.currency_code,
  });
  return "Checkout session completed and tenant activated.";
}

async function handleInvoicePaid(event: StripeEvent) {
  const object = getStripeObject(event);
  const metadata = invoiceMetadata(object);
  const subscriptionId = getString(object.subscription || object.parent?.subscription_details?.subscription);
  const customerId = getString(object.customer);
  const tenant = await findTenant({ tenantId: metadata.tenant_id, subscriptionId, customerId });
  if (!tenant?.id) throw new Error("Could not match Stripe invoice to an Orduva tenant.");

  const { amount, planCode, currencyCode, billingInterval } = amountFromMetadataOrInvoice(metadata, object);
  const invoiceId = getString(object.id) || event.id;
  const billingPeriodMonth = billingMonthFromInvoice(object);

  await markTenantActive({
    tenantId: tenant.id,
    customerId,
    subscriptionId,
    planCode: metadata.plan_code || planCodeFromTenantPlanName(tenant.plan_name),
    billingInterval: metadata.billing_interval || billingInterval,
    currencyCode: metadata.currency_code || currencyCode,
  });

  await recordTenantSubscriptionPayment({
    tenantId: tenant.id,
    amount,
    currencyCode,
    billingPeriodMonth,
    paymentReference: invoiceId,
    sourceEventId: event.id,
    planCode,
    billingInterval,
    customerId,
    subscriptionId,
  });

  return "Invoice paid, tenant activated, payment event recorded and referral credit created where applicable.";
}

async function handleSubscriptionUpdated(event: StripeEvent) {
  const object = getStripeObject(event);
  const metadata = subscriptionMetadata(object);
  const subscriptionId = getString(object.id);
  const customerId = getString(object.customer);
  const tenant = await findTenant({ tenantId: metadata.tenant_id, subscriptionId, customerId });
  if (!tenant?.id) throw new Error("Could not match Stripe subscription to an Orduva tenant.");

  const stripeStatus = getString(object.status);
  if (["active", "trialing"].includes(stripeStatus)) {
    await markTenantActive({
      tenantId: tenant.id,
      customerId,
      subscriptionId,
      planCode: metadata.plan_code || planCodeFromTenantPlanName(tenant.plan_name),
      billingInterval: metadata.billing_interval || "monthly",
      currencyCode: metadata.currency_code || "ZAR",
    });
    return "Stripe subscription active; tenant marked active.";
  }

  const subscriptionStatus = stripeStatus === "past_due" || stripeStatus === "unpaid" ? "past_due" : stripeStatus === "canceled" || stripeStatus === "cancelled" ? "cancelled" : "active";
  await db
    .from("tenants")
    .update({ subscription_status: subscriptionStatus, billing_provider: "stripe", billing_customer_id: customerId || tenant.billing_customer_id, billing_subscription_id: subscriptionId || tenant.billing_subscription_id })
    .eq("id", tenant.id);
  return `Stripe subscription status updated to ${subscriptionStatus}.`;
}

async function handleSubscriptionDeleted(event: StripeEvent) {
  const object = getStripeObject(event);
  const metadata = subscriptionMetadata(object);
  const subscriptionId = getString(object.id);
  const customerId = getString(object.customer);
  const tenant = await findTenant({ tenantId: metadata.tenant_id, subscriptionId, customerId });
  if (!tenant?.id) throw new Error("Could not match deleted Stripe subscription to an Orduva tenant.");
  await db
    .from("tenants")
    .update({ subscription_status: "cancelled", billing_provider: "stripe", billing_customer_id: customerId || tenant.billing_customer_id, billing_subscription_id: subscriptionId || tenant.billing_subscription_id })
    .eq("id", tenant.id);
  return "Stripe subscription deleted; tenant marked cancelled.";
}

export async function processStripeWebhook(event: StripeEvent): Promise<StripeWebhookProcessResult> {
  const started = await startWebhookEvent(event);
  if (!started) {
    return { ok: true, duplicate: true, message: "Stripe webhook event already processed or currently processing." };
  }

  try {
    let message = "Stripe event ignored.";
    let ignored = false;
    switch (event.type) {
      case "checkout.session.completed":
        message = await handleCheckoutCompleted(event);
        break;
      case "invoice.paid":
        message = await handleInvoicePaid(event);
        break;
      case "customer.subscription.updated":
        message = await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        message = await handleSubscriptionDeleted(event);
        break;
      default:
        ignored = true;
        break;
    }
    await finishWebhookEvent(event.id, ignored ? "ignored" : "processed", message);
    return { ok: true, ignored, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook processing failed.";
    await finishWebhookEvent(event.id, "failed", message);
    throw error;
  }
}
