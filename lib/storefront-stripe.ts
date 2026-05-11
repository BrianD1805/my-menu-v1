import crypto from "crypto";
import { db } from "@/lib/db";

export type TenantStripeCustomerSettings = {
  tenant_id: string;
  enable_stripe_customer_payments: boolean | null;
  stripe_connection_status: string | null;
  stripe_customer_publishable_key: string | null;
  stripe_customer_secret_key: string | null;
  stripe_customer_webhook_secret: string | null;
  stripe_customer_account_label: string | null;
  stripe_customer_test_mode: boolean | null;
  stripe_customer_payments_live: boolean | null;
};

type StripeEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data?: { object?: Record<string, any> };
};

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function configured(status: string | null | undefined) {
  return status === "configured" || status === "connected" || status === "active";
}

export async function loadTenantStripeCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_publishable_key, stripe_customer_secret_key, stripe_customer_webhook_secret, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load tenant Stripe settings.");
  return (data || null) as TenantStripeCustomerSettings | null;
}

export function assertTenantStripeReady(settings: TenantStripeCustomerSettings | null) {
  if (!settings) throw new Error("Stripe is not configured for this store.");
  if (settings.enable_stripe_customer_payments !== true) throw new Error("Stripe customer payments are not enabled for this store.");
  if (!configured(settings.stripe_connection_status)) throw new Error("Stripe is not marked as connected for this store.");
  if (settings.stripe_customer_payments_live !== true) throw new Error("Stripe customer payments are not live for this store yet.");
  if (!getString(settings.stripe_customer_publishable_key)) throw new Error("Tenant Stripe publishable key is missing.");
  if (!getString(settings.stripe_customer_secret_key)) throw new Error("Tenant Stripe secret key is missing.");
  if (!getString(settings.stripe_customer_webhook_secret)) throw new Error("Tenant Stripe webhook secret is missing.");
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function toStripeUnitAmount(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

export async function createTenantStripeOrderCheckoutSession(input: {
  req: Request;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currencyCode: string;
}) {
  const stripeSettings = await loadTenantStripeCustomerSettings(input.tenantId);
  assertTenantStripeReady(stripeSettings);

  const secretKey = getString(stripeSettings?.stripe_customer_secret_key);
  const currencyCode = String(input.currencyCode || "GBP").toLowerCase();
  const unitAmount = toStripeUnitAmount(input.total);
  if (unitAmount < 50) throw new Error("Order total is too small for Stripe Checkout.");

  const origin = originFromRequest(input.req);
  const successUrl = `${origin}/checkout/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/checkout/payment/stripe/cancel?order_id=${encodeURIComponent(input.orderId)}`;

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", input.orderId);
  params.set("line_items[0][price_data][currency]", currencyCode);
  params.set("line_items[0][price_data][product_data][name]", `${input.tenantName} order`);
  params.set("line_items[0][price_data][product_data][description]", `Order ${input.orderId.slice(0, 8)} via Orduva`);
  params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[orduva_flow]", "storefront_order_payment");
  params.set("metadata[tenant_id]", input.tenantId);
  params.set("metadata[tenant_slug]", input.tenantSlug);
  params.set("metadata[order_id]", input.orderId);
  params.set("metadata[customer_name]", input.customerName.slice(0, 120));
  params.set("metadata[customer_phone]", input.customerPhone.slice(0, 80));
  params.set("payment_intent_data[metadata][orduva_flow]", "storefront_order_payment");
  params.set("payment_intent_data[metadata][tenant_id]", input.tenantId);
  params.set("payment_intent_data[metadata][tenant_slug]", input.tenantSlug);
  params.set("payment_intent_data[metadata][order_id]", input.orderId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null) as { id?: string; url?: string; payment_intent?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.id || !data?.url) {
    throw new Error(data?.error?.message || `Tenant Stripe checkout failed with status ${response.status}`);
  }

  return {
    sessionId: data.id,
    url: data.url,
    paymentIntentId: getString(data.payment_intent) || null,
  };
}

function parseSignatureHeader(signatureHeader: string | null) {
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
  return { timestamp, signature };
}

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, webhookSecret: string) {
  const { timestamp, signature } = parseSignatureHeader(signatureHeader);
  const expected = crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
  if (!timingSafeEqualText(expected, signature)) throw new Error("Stripe webhook signature verification failed.");
}

function readTenantIdFromEvent(event: StripeEvent) {
  const object = event.data?.object || {};
  const metadata = (object.metadata || {}) as Record<string, any>;
  const paymentIntentData = (object.payment_intent_data || {}) as Record<string, any>;
  const nestedMetadata = (paymentIntentData.metadata || {}) as Record<string, any>;
  return getString(metadata.tenant_id) || getString(nestedMetadata.tenant_id);
}

function readOrderIdFromObject(object: Record<string, any>) {
  const metadata = (object.metadata || {}) as Record<string, any>;
  return getString(metadata.order_id) || getString(object.client_reference_id);
}

export async function verifyAndParseTenantStripeWebhook(rawBody: string, signatureHeader: string | null) {
  const unverified = JSON.parse(rawBody) as StripeEvent;
  if (!unverified?.id || !unverified?.type) throw new Error("Invalid Stripe event payload.");
  const tenantId = readTenantIdFromEvent(unverified);
  if (tenantId) {
    const stripeSettings = await loadTenantStripeCustomerSettings(tenantId);
    const webhookSecret = getString(stripeSettings?.stripe_customer_webhook_secret);
    if (!webhookSecret) throw new Error("Tenant Stripe webhook secret is not configured.");
    verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    return unverified;
  }

  // Some Stripe events, especially charge.refunded, may not reliably include
  // the metadata we attach to the Checkout Session and PaymentIntent. In that
  // case we still verify safely by trying the saved tenant webhook secrets.
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, stripe_customer_webhook_secret")
    .not("stripe_customer_webhook_secret", "is", null);
  if (error || !data?.length) throw new Error("No tenant Stripe webhook secrets are available for verification.");

  for (const row of data as Array<{ tenant_id: string; stripe_customer_webhook_secret: string | null }>) {
    const secret = getString(row.stripe_customer_webhook_secret);
    if (!secret) continue;
    try {
      verifyStripeSignature(rawBody, signatureHeader, secret);
      return unverified;
    } catch {
      // Try the next tenant secret.
    }
  }

  throw new Error("Stripe webhook signature verification failed for all tenant secrets.");
}

async function updateOrderPayment(input: {
  orderId: string;
  tenantId?: string | null;
  paymentStatus: string;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
}) {
  if (!input.orderId) throw new Error("Stripe event did not include Orduva order metadata.");
  const patch: Record<string, unknown> = {
    payment_provider: "stripe",
    payment_status: input.paymentStatus,
  };
  if (input.sessionId) patch.payment_checkout_session_id = input.sessionId;
  if (input.paymentIntentId) patch.payment_intent_id = input.paymentIntentId;
  if (input.paymentReference) patch.payment_reference = input.paymentReference;
  if (input.paidAt) patch.paid_at = input.paidAt;

  let query = db.from("orders").update(patch).eq("id", input.orderId);
  if (input.tenantId) query = query.eq("tenant_id", input.tenantId);
  const { error } = await query;
  if (error) throw new Error("Could not update storefront order payment status.");
}

export async function processTenantStripeWebhook(event: StripeEvent) {
  const object = (event.data?.object || {}) as Record<string, any>;
  const metadata = (object.metadata || {}) as Record<string, any>;
  const tenantId = getString(metadata.tenant_id);
  const orderId = readOrderIdFromObject(object);
  const sessionId = event.type.startsWith("checkout.session") ? getString(object.id) : getString(metadata.checkout_session_id);
  switch (event.type) {
    case "checkout.session.completed":
      await updateOrderPayment({
        orderId,
        tenantId,
        paymentStatus: "paid",
        sessionId: getString(object.id),
        paymentIntentId: getString(object.payment_intent),
        paymentReference: getString(object.payment_intent) || getString(object.id),
        paidAt: new Date().toISOString(),
      });
      return "Storefront Stripe checkout completed and order marked paid.";
    case "checkout.session.expired":
      await updateOrderPayment({ orderId, tenantId, paymentStatus: "cancelled", sessionId: getString(object.id), paymentReference: getString(object.id) });
      return "Storefront Stripe checkout expired and order marked cancelled.";
    case "payment_intent.succeeded":
      await updateOrderPayment({
        orderId,
        tenantId,
        paymentStatus: "paid",
        paymentIntentId: getString(object.id),
        paymentReference: getString(object.id),
        paidAt: new Date().toISOString(),
      });
      return "Storefront Stripe payment intent succeeded and order marked paid.";
    case "payment_intent.payment_failed":
      await updateOrderPayment({ orderId, tenantId, paymentStatus: "failed", paymentIntentId: getString(object.id), paymentReference: getString(object.id) });
      return "Storefront Stripe payment intent failed and order marked failed.";
    case "charge.refunded":
      await updateOrderPayment({
        orderId,
        tenantId,
        paymentStatus: "refunded",
        paymentIntentId: getString(object.payment_intent),
        paymentReference: getString(object.id),
      });
      return "Storefront Stripe charge refunded and order marked refunded.";
    default:
      return `Storefront Stripe event ignored: ${event.type}`;
  }
}
