import {
  BillingInterval,
  PricingCurrencyCode,
  PricingPlanCode,
  formatPlanPrice,
  getPricingCurrency,
  getPricingPlan,
  normalisePricingCurrencyCode,
  normalisePricingPlanCode,
  priceForPlan,
} from "@/lib/pricing";

export type StripeCheckoutInput = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  ownerEmail?: string | null;
  planCode: PricingPlanCode;
  currencyCode: PricingCurrencyCode;
  billingInterval: BillingInterval;
};

export type StripeCheckoutResult = {
  id: string;
  url: string;
};

export function normaliseBillingInterval(value: unknown): BillingInterval {
  const text = String(value || "").trim().toLowerCase();
  return text === "yearly" || text === "annual" || text === "annually" ? "yearly" : "monthly";
}

export function planCodeFromTenantPlanName(planName: unknown): PricingPlanCode {
  const text = String(planName || "").trim().toLowerCase();
  if (text.includes("pro")) return "pro";
  if (text.includes("growth")) return "growth";
  return normalisePricingPlanCode(text || "starter");
}

export function billingIntervalFromTenantPlanName(planName: unknown): BillingInterval {
  const text = String(planName || "").trim().toLowerCase();
  if (text.includes("yearly") || text.includes("annual")) return "yearly";
  return "monthly";
}

export function stripePriceEnvKey(planCode: PricingPlanCode, currencyCode: PricingCurrencyCode, billingInterval: BillingInterval) {
  return `STRIPE_PRICE_${planCode}_${currencyCode}_${billingInterval}`.toUpperCase();
}

export function getStripePriceId(planCode: PricingPlanCode, currencyCode: PricingCurrencyCode, billingInterval: BillingInterval) {
  const envKey = stripePriceEnvKey(planCode, currencyCode, billingInterval);
  const priceId = process.env[envKey]?.trim() || "";
  return { envKey, priceId };
}


export type StripePriceConfigStatus = {
  planCode: PricingPlanCode;
  planName: string;
  currencyCode: PricingCurrencyCode;
  billingInterval: BillingInterval;
  envKey: string;
  priceId: string;
  configured: boolean;
  expectedAmount: number;
  formattedAmount: string;
};

export function maskStripePriceId(priceId: string) {
  const clean = String(priceId || "").trim();
  if (!clean) return "";
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

export function getAllStripePriceConfigStatuses(): StripePriceConfigStatus[] {
  const intervals: BillingInterval[] = ["monthly", "yearly"];
  const currencies: PricingCurrencyCode[] = ["ZAR", "KES", "GBP", "USD", "EUR"];
  const plans: PricingPlanCode[] = ["starter", "growth", "pro"];

  return currencies.flatMap((currencyCode) =>
    plans.flatMap((planCode) =>
      intervals.map((billingInterval) => {
        const { envKey, priceId } = getStripePriceId(planCode, currencyCode, billingInterval);
        const summary = getStripePlanSummary(planCode, currencyCode, billingInterval);
        return {
          planCode,
          planName: summary.plan.name,
          currencyCode,
          billingInterval,
          envKey,
          priceId: maskStripePriceId(priceId),
          configured: Boolean(priceId),
          expectedAmount: summary.amount,
          formattedAmount: summary.formattedAmount,
        };
      }),
    ),
  );
}

export function getStripePlanSummary(planCode: PricingPlanCode, currencyCode: PricingCurrencyCode, billingInterval: BillingInterval) {
  const plan = getPricingPlan(planCode);
  const currency = getPricingCurrency(currencyCode);
  const amount = priceForPlan(plan.code, currency.code, billingInterval);
  return {
    plan,
    currency,
    amount,
    formattedAmount: formatPlanPrice(amount, currency.code, { forceDecimals: billingInterval === "monthly" }),
    label: `${plan.name} ${billingInterval === "yearly" ? "yearly" : "monthly"}`,
  };
}

function appendQuery(url: string, values: Record<string, string>) {
  const parsed = new URL(url);
  Object.entries(values).forEach(([key, value]) => parsed.searchParams.set(key, value));
  return parsed.toString().replace(/%7BCHECKOUT_SESSION_ID%7D/gi, "{CHECKOUT_SESSION_ID}");
}

export function buildBillingReturnUrls(req: Request, input: StripeCheckoutInput) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.ORDUVA_PUBLIC_SITE_URL?.trim() || new URL(req.url).origin;
  const baseSuccess = process.env.ORDUVA_STRIPE_SUCCESS_URL?.trim() || `${origin}/billing/success`;
  const baseCancel = process.env.ORDUVA_STRIPE_CANCEL_URL?.trim() || `${origin}/billing/cancel`;
  const params = {
    tenant: input.tenantSlug,
    plan: input.planCode,
    currency: input.currencyCode,
    billing: input.billingInterval,
  };
  return {
    successUrl: appendQuery(baseSuccess, { ...params, session_id: "{CHECKOUT_SESSION_ID}" }),
    cancelUrl: appendQuery(baseCancel, params),
  };
}

export async function createStripeCheckoutSession(req: Request, input: StripeCheckoutInput): Promise<StripeCheckoutResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
  if (!secretKey) {
    throw new Error("Stripe secret key is not configured. Add STRIPE_SECRET_KEY in Netlify environment variables.");
  }

  const planCode = normalisePricingPlanCode(input.planCode);
  const currencyCode = normalisePricingCurrencyCode(input.currencyCode);
  const billingInterval = normaliseBillingInterval(input.billingInterval);
  const { envKey, priceId } = getStripePriceId(planCode, currencyCode, billingInterval);
  if (!priceId) {
    throw new Error(`Stripe price is not configured for ${planCode}/${currencyCode}/${billingInterval}. Add ${envKey} in Netlify environment variables.`);
  }

  const { successUrl, cancelUrl } = buildBillingReturnUrls(req, { ...input, planCode, currencyCode, billingInterval });
  const summary = getStripePlanSummary(planCode, currencyCode, billingInterval);

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", input.tenantId);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[tenant_id]", input.tenantId);
  params.set("metadata[tenant_slug]", input.tenantSlug);
  params.set("metadata[tenant_name]", input.tenantName);
  params.set("metadata[plan_code]", planCode);
  params.set("metadata[currency_code]", currencyCode);
  params.set("metadata[billing_interval]", billingInterval);
  params.set("metadata[orduva_price_label]", `${summary.label} ${summary.formattedAmount}`);
  params.set("subscription_data[metadata][tenant_id]", input.tenantId);
  params.set("subscription_data[metadata][tenant_slug]", input.tenantSlug);
  params.set("subscription_data[metadata][plan_code]", planCode);
  params.set("subscription_data[metadata][currency_code]", currencyCode);
  params.set("subscription_data[metadata][billing_interval]", billingInterval);
  if (input.ownerEmail) params.set("customer_email", input.ownerEmail);
  params.set("allow_promotion_codes", "true");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null) as { id?: string; url?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.url || !data?.id) {
    const message = data?.error?.message || `Stripe checkout failed with status ${response.status}`;
    throw new Error(message);
  }
  return { id: data.id, url: data.url };
}
