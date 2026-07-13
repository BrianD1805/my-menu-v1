import {
  CUSTOM_DOMAIN_ADDON_USD_MONTHLY,
  CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY,
  customDomainAddonPrice,
  normaliseCustomDomain,
} from "@/lib/custom-domain-addon";

export type CustomDomainStripeCheckoutInput = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  ownerEmail?: string | null;
  customDomainId: string;
  domainName: string;
  priceId?: string | null;
  monthlyUsd?: number | null;
};

export type CustomDomainStripeCheckoutResult = {
  id: string;
  url: string;
  priceId: string;
  amount: number;
};

export type StripeCheckoutSessionSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  customerId: string;
  subscriptionId: string;
  metadata: Record<string, string>;
};

function stripeApiSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function getCustomDomainStripePriceId(value?: string | null) {
  const configured = String(value || "").trim();
  if (configured) return configured;
  return process.env[CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY]?.trim() || "";
}

export function assertCustomDomainStripeReady(value?: string | null) {
  const secretKey = stripeApiSecretKey();
  if (!secretKey) {
    throw new Error(
      "Stripe secret key is not configured. Add STRIPE_SECRET_KEY in Netlify environment variables.",
    );
  }

  const priceId = getCustomDomainStripePriceId(value);
  if (!priceId) {
    throw new Error(
      `Stripe custom-domain Price ID is not configured. Add it in Owner Platform or set ${CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY} in Netlify environment variables.`,
    );
  }

  return { secretKey, priceId };
}

function appendQuery(url: string, values: Record<string, string>) {
  const parsed = new URL(url);
  Object.entries(values).forEach(([key, value]) =>
    parsed.searchParams.set(key, value),
  );
  return parsed
    .toString()
    .replace(/%7BCHECKOUT_SESSION_ID%7D/gi, "{CHECKOUT_SESSION_ID}");
}

export function buildCustomDomainBillingReturnUrls(
  req: Request,
  input: { tenantSlug: string; customDomainId: string; domainName: string },
) {
  const origin = new URL(req.url).origin;
  const successBase = `${origin}/admin/custom-domains/billing/success`;
  const cancelBase = `${origin}/admin/custom-domains/billing/cancel`;
  const params = {
    tenant: input.tenantSlug,
    domain_id: input.customDomainId,
    domain: normaliseCustomDomain(input.domainName),
  };
  return {
    successUrl: appendQuery(successBase, {
      ...params,
      session_id: "{CHECKOUT_SESSION_ID}",
    }),
    cancelUrl: appendQuery(cancelBase, params),
  };
}

export async function createCustomDomainStripeCheckoutSession(
  req: Request,
  input: CustomDomainStripeCheckoutInput,
): Promise<CustomDomainStripeCheckoutResult> {
  const addonPrice = customDomainAddonPrice(
    input.monthlyUsd || CUSTOM_DOMAIN_ADDON_USD_MONTHLY,
    input.priceId || null,
  );
  const { secretKey, priceId } = assertCustomDomainStripeReady(
    addonPrice.stripePriceId,
  );
  const { successUrl, cancelUrl } = buildCustomDomainBillingReturnUrls(req, {
    tenantSlug: input.tenantSlug,
    customDomainId: input.customDomainId,
    domainName: input.domainName,
  });

  const domainName = normaliseCustomDomain(input.domainName);
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", input.customDomainId);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[orduva_flow]", "custom_domain_addon");
  params.set("metadata[tenant_id]", input.tenantId);
  params.set("metadata[tenant_slug]", input.tenantSlug);
  params.set("metadata[tenant_name]", input.tenantName);
  params.set("metadata[custom_domain_id]", input.customDomainId);
  params.set("metadata[domain_name]", domainName);
  params.set("metadata[addon_type]", "custom_domain");
  params.set("metadata[addon_price_usd_monthly]", addonPrice.amount.toFixed(2));
  params.set("subscription_data[metadata][orduva_flow]", "custom_domain_addon");
  params.set("subscription_data[metadata][tenant_id]", input.tenantId);
  params.set("subscription_data[metadata][tenant_slug]", input.tenantSlug);
  params.set("subscription_data[metadata][custom_domain_id]", input.customDomainId);
  params.set("subscription_data[metadata][domain_name]", domainName);
  params.set("subscription_data[metadata][addon_type]", "custom_domain");
  params.set("allow_promotion_codes", "false");
  if (input.ownerEmail) params.set("customer_email", input.ownerEmail);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.id || !data?.url) {
    throw new Error(
      data?.error?.message ||
        `Stripe custom-domain checkout failed with status ${response.status}`,
    );
  }

  return { id: data.id, url: data.url, priceId, amount: addonPrice.amount };
}

export async function retrieveCustomDomainStripeCheckoutSession(
  sessionId: string,
): Promise<StripeCheckoutSessionSummary> {
  const cleanSessionId = String(sessionId || "").trim();
  if (!cleanSessionId) throw new Error("Missing Stripe checkout session id.");

  const secretKey = stripeApiSecretKey();
  if (!secretKey) {
    throw new Error(
      "Stripe secret key is not configured. Add STRIPE_SECRET_KEY in Netlify environment variables.",
    );
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cleanSessionId)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => null)) as any;
  if (!response.ok || !data?.id) {
    throw new Error(
      data?.error?.message ||
        `Could not verify Stripe custom-domain checkout session ${cleanSessionId}.`,
    );
  }

  return {
    id: String(data.id || ""),
    status: String(data.status || ""),
    paymentStatus: String(data.payment_status || ""),
    customerId: typeof data.customer === "string" ? data.customer : "",
    subscriptionId:
      typeof data.subscription === "string" ? data.subscription : "",
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? Object.fromEntries(
            Object.entries(data.metadata).map(([key, value]) => [
              key,
              String(value || ""),
            ]),
          )
        : {},
  };
}

export function isCustomDomainStripeCheckoutPaid(
  session: StripeCheckoutSessionSummary,
) {
  return (
    session.metadata?.orduva_flow === "custom_domain_addon" &&
    session.status === "complete" &&
    session.paymentStatus === "paid" &&
    Boolean(session.subscriptionId)
  );
}
