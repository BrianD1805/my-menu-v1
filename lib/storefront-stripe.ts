import crypto from "crypto";
import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant } from "@/lib/web-push";

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

type RewardOrderMetadata = {
  reward_tier: string | null;
  reward_discount_percent: number;
  reward_discount_amount: number;
  subtotal_total: number;
  rewards_spend_before: number | null;
  rewards_spend_after: number | null;
};

type DiscountOrderMetadata = {
  discount_rule_id: string | null;
  discount_code: string | null;
  discount_name: string | null;
  discount_scope: string | null;
  discount_type: string | null;
  discount_value: number;
  discount_base_amount: number;
  discount_amount: number;
  discount_allow_with_rewards: boolean;
  discount_only_this_discount: boolean;
};

type PendingOrderPayload = {
  tenantSlug: string;
  tenantName: string;
  customerName: string;
  customerPhone: string;
  customerAccountId: string | null;
  customerAddress: string | null;
  orderType: "delivery" | "collection";
  notes: string | null;
  total: number;
  amountDueNow?: number;
  preorder?: Record<string, any> | null;
  currencyCode: string;
  paymentProvider: "stripe";
  paymentMethodLabel: string;
  rewards?: RewardOrderMetadata | null;
  discounts?: DiscountOrderMetadata | null;
  items: Array<{
    product_id: string | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    variant_id?: string | null;
    variant_label?: string | null;
    variant_name?: string | null;
    variant_price_delta?: number | null;
    customer_entered_amount?: number | null;
    customer_reference?: string | null;
    customer_note?: string | null;
  }>;
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
  return (
    status === "configured" || status === "connected" || status === "active"
  );
}

export async function loadTenantStripeCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select(
      "tenant_id, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_publishable_key, stripe_customer_secret_key, stripe_customer_webhook_secret, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_payments_live",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load tenant Stripe settings.");
  return (data || null) as TenantStripeCustomerSettings | null;
}

export function assertTenantStripeReady(
  settings: TenantStripeCustomerSettings | null,
) {
  if (!settings) throw new Error("Stripe is not configured for this store.");
  if (settings.enable_stripe_customer_payments !== true)
    throw new Error("Stripe customer payments are not enabled for this store.");
  if (!configured(settings.stripe_connection_status))
    throw new Error("Stripe is not marked as connected for this store.");
  if (settings.stripe_customer_payments_live !== true)
    throw new Error(
      "Stripe customer payments are not live for this store yet.",
    );
  if (!getString(settings.stripe_customer_publishable_key))
    throw new Error("Tenant Stripe publishable key is missing.");
  if (!getString(settings.stripe_customer_secret_key))
    throw new Error("Tenant Stripe secret key is missing.");
  if (!getString(settings.stripe_customer_webhook_secret))
    throw new Error("Tenant Stripe webhook secret is missing.");
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function toStripeUnitAmount(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

export async function createTenantStripeOrderCheckoutIntent(input: {
  req: Request;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  customerName: string;
  customerPhone: string;
  customerAccountId: string | null;
  customerAddress: string | null;
  orderType: "delivery" | "collection";
  notes: string | null;
  items: PendingOrderPayload["items"];
  total: number;
  orderTotal?: number;
  preorder?: Record<string, any> | null;
  currencyCode: string;
  paymentMethodLabel: string;
  rewards?: RewardOrderMetadata | null;
  discounts?: DiscountOrderMetadata | null;
}) {
  const stripeSettings = await loadTenantStripeCustomerSettings(input.tenantId);
  assertTenantStripeReady(stripeSettings);

  const payload: PendingOrderPayload = {
    tenantSlug: input.tenantSlug,
    tenantName: input.tenantName,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAccountId: input.customerAccountId,
    customerAddress: input.customerAddress,
    orderType: input.orderType,
    notes: input.notes,
    total: input.orderTotal ?? input.total,
    amountDueNow: input.total,
    preorder: input.preorder || null,
    currencyCode: input.currencyCode,
    paymentProvider: "stripe",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    discounts: input.discounts || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "stripe",
      status: "created",
      amount_total: input.total,
      currency_code: input.currencyCode,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      order_payload: payload,
      preorder_payment_stage: input.preorder ? "deposit" : "full_payment",
    })
    .select("id")
    .single();

  if (intentError || !intent?.id)
    throw new Error("Could not prepare Stripe checkout.");

  const checkoutId = String(intent.id);
  const secretKey = getString(stripeSettings?.stripe_customer_secret_key);
  const currencyCode = String(input.currencyCode || "GBP").toLowerCase();
  const unitAmount = toStripeUnitAmount(input.total);
  if (unitAmount < 50)
    throw new Error("Order total is too small for Stripe Checkout.");

  const origin = originFromRequest(input.req);
  const successUrl = `${origin}/checkout/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/checkout/payment/stripe/cancel?checkout_id=${encodeURIComponent(checkoutId)}`;

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", checkoutId);
  params.set("line_items[0][price_data][currency]", currencyCode);
  params.set(
    "line_items[0][price_data][product_data][name]",
    `${input.tenantName} order`,
  );
  params.set(
    "line_items[0][price_data][product_data][description]",
    `Customer order via Orduva`,
  );
  params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[orduva_flow]", "storefront_order_checkout");
  params.set("metadata[tenant_id]", input.tenantId);
  params.set("metadata[tenant_slug]", input.tenantSlug);
  params.set("metadata[checkout_id]", checkoutId);
  params.set("metadata[customer_name]", input.customerName.slice(0, 120));
  params.set("metadata[customer_phone]", input.customerPhone.slice(0, 80));
  params.set(
    "payment_intent_data[metadata][orduva_flow]",
    "storefront_order_checkout",
  );
  params.set("payment_intent_data[metadata][tenant_id]", input.tenantId);
  params.set("payment_intent_data[metadata][tenant_slug]", input.tenantSlug);
  params.set("payment_intent_data[metadata][checkout_id]", checkoutId);

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
    payment_intent?: string;
    error?: { message?: string };
  } | null;
  if (!response.ok || !data?.id || !data?.url) {
    await db
      .from("storefront_payment_intents")
      .update({ status: "failed" })
      .eq("id", checkoutId)
      .eq("tenant_id", input.tenantId);
    throw new Error(
      data?.error?.message ||
        `Tenant Stripe checkout failed with status ${response.status}`,
    );
  }

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      stripe_checkout_session_id: data.id,
      stripe_payment_intent_id: getString(data.payment_intent) || null,
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return {
    checkoutId,
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
  if (!timestamp || !signature)
    throw new Error("Invalid Stripe signature header.");
  return { timestamp, signature };
}

function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
) {
  const { timestamp, signature } = parseSignatureHeader(signatureHeader);
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  if (!timingSafeEqualText(expected, signature))
    throw new Error("Stripe webhook signature verification failed.");
}

function readTenantIdFromEvent(event: StripeEvent) {
  const object = event.data?.object || {};
  const metadata = (object.metadata || {}) as Record<string, any>;
  const paymentIntentData = (object.payment_intent_data || {}) as Record<
    string,
    any
  >;
  const nestedMetadata = (paymentIntentData.metadata || {}) as Record<
    string,
    any
  >;
  return getString(metadata.tenant_id) || getString(nestedMetadata.tenant_id);
}

function readCheckoutIdFromObject(object: Record<string, any>) {
  const metadata = (object.metadata || {}) as Record<string, any>;
  return (
    getString(metadata.checkout_id) || getString(object.client_reference_id)
  );
}

export async function verifyAndParseTenantStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
) {
  const unverified = JSON.parse(rawBody) as StripeEvent;
  if (!unverified?.id || !unverified?.type)
    throw new Error("Invalid Stripe event payload.");
  const tenantId = readTenantIdFromEvent(unverified);
  if (tenantId) {
    const stripeSettings = await loadTenantStripeCustomerSettings(tenantId);
    const webhookSecret = getString(
      stripeSettings?.stripe_customer_webhook_secret,
    );
    if (!webhookSecret)
      throw new Error("Tenant Stripe webhook secret is not configured.");
    verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    return unverified;
  }

  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, stripe_customer_webhook_secret")
    .not("stripe_customer_webhook_secret", "is", null);
  if (error || !data?.length)
    throw new Error(
      "No tenant Stripe webhook secrets are available for verification.",
    );

  for (const row of data as Array<{
    tenant_id: string;
    stripe_customer_webhook_secret: string | null;
  }>) {
    const secret = getString(row.stripe_customer_webhook_secret);
    if (!secret) continue;
    try {
      verifyStripeSignature(rawBody, signatureHeader, secret);
      return unverified;
    } catch {
      // Try the next tenant secret.
    }
  }

  throw new Error(
    "Stripe webhook signature verification failed for all tenant secrets.",
  );
}

async function loadIntentByCheckout(input: {
  checkoutId?: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  tenantId?: string | null;
}) {
  let query = db.from("storefront_payment_intents").select("*");
  if (input.checkoutId) query = query.eq("id", input.checkoutId);
  else if (input.sessionId)
    query = query.eq("stripe_checkout_session_id", input.sessionId);
  else if (input.paymentIntentId)
    query = query.eq("stripe_payment_intent_id", input.paymentIntentId);
  else throw new Error("Stripe event did not include checkout metadata.");
  if (input.tenantId) query = query.eq("tenant_id", input.tenantId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load Stripe checkout intent.");
  return data as Record<string, any> | null;
}

function reduceVariantStock(
  productVariants: any[],
  variantId: string,
  quantity: number,
) {
  return productVariants.map((variant: any) => {
    if (variant?.id !== variantId || variant?.stockEnabled !== true)
      return variant;
    const currentStock = Math.max(
      0,
      Math.floor(Number(variant.stockQuantity || 0)),
    );
    return { ...variant, stockQuantity: Math.max(0, currentStock - quantity) };
  });
}

async function reduceStockAfterPaidOrder(
  tenantId: string,
  items: PendingOrderPayload["items"],
) {
  const quantityBySellableLine = new Map<string, number>();
  for (const item of items) {
    const productId = String(item.product_id || "");
    if (!productId) continue;
    const variantId = item.variant_id ? String(item.variant_id) : "base";
    const lineKey = `${productId}::${variantId}`;
    quantityBySellableLine.set(
      lineKey,
      (quantityBySellableLine.get(lineKey) || 0) + Number(item.quantity || 0),
    );
  }

  for (const [lineKey, quantity] of quantityBySellableLine.entries()) {
    const [productId, variantId] = lineKey.split("::");
    const { data: product, error } = await db
      .from("products")
      .select(
        "id, stock_enabled, stock_quantity, product_variants, product_type, custom_amount_enabled",
      )
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error || !product) continue;
    if (
      (product as any).product_type === "customer_amount" ||
      (product as any).custom_amount_enabled === true
    )
      continue;

    if (variantId && variantId !== "base") {
      const variants = Array.isArray(product.product_variants)
        ? product.product_variants
        : [];
      const selectedVariant = variants.find(
        (variant: any) => variant?.id === variantId,
      );
      if (!selectedVariant?.stockEnabled) continue;
      const nextVariants = reduceVariantStock(variants, variantId, quantity);
      const { error: stockError } = await db
        .from("products")
        .update({ product_variants: nextVariants })
        .eq("id", product.id)
        .eq("tenant_id", tenantId);
      if (stockError)
        console.error(
          "Failed to reduce variant stock after Stripe payment",
          stockError,
        );
      continue;
    }

    if (!product.stock_enabled) continue;
    const nextStock = Math.max(
      0,
      Number(product.stock_quantity || 0) - quantity,
    );
    const { error: stockError } = await db
      .from("products")
      .update({ stock_quantity: nextStock })
      .eq("id", product.id)
      .eq("tenant_id", tenantId);
    if (stockError)
      console.error(
        "Failed to reduce product stock after Stripe payment",
        stockError,
      );
  }
}
export async function createPaidOrderFromIntent(input: {
  intent: Record<string, any>;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
}) {
  const finalSessionId =
    input.sessionId || input.intent.stripe_checkout_session_id || null;
  const finalPaymentIntentId =
    input.paymentIntentId || input.intent.stripe_payment_intent_id || null;

  if (input.intent.order_id) {
    await db
      .from("orders")
      .update({
        payment_status: "paid",
        payment_checkout_session_id: finalSessionId,
        payment_intent_id: finalPaymentIntentId,
        payment_reference:
          input.paymentReference ||
          finalPaymentIntentId ||
          finalSessionId ||
          null,
        paid_at: input.paidAt || new Date().toISOString(),
      })
      .eq("id", input.intent.order_id)
      .eq("tenant_id", input.intent.tenant_id);
    await db
      .from("storefront_payment_intents")
      .update({
        status: "paid",
        stripe_checkout_session_id: finalSessionId,
        stripe_payment_intent_id: finalPaymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.intent.id)
      .eq("tenant_id", input.intent.tenant_id);
    return input.intent.order_id as string;
  }

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({
      status: "processing",
      stripe_checkout_session_id: finalSessionId,
      stripe_payment_intent_id: finalPaymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started", "processing", "paid"])
    .select("*")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim Stripe checkout intent.");

  if (!claimedIntent) {
    const latest = await loadIntentByCheckout({
      checkoutId: input.intent.id,
      tenantId: input.intent.tenant_id,
    });
    if (latest?.order_id) return latest.order_id as string;

    // If Stripe has already marked the payment intent as paid but no order has been
    // linked yet, do not report success to the customer without creating the Orduva
    // order. Returning an empty order id here leaves stock unreduced and the cart uncleared.
    throw new Error(
      "Stripe payment is paid but the Orduva order has not been created yet.",
    );
  }

  input.intent = claimedIntent;

  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length)
    throw new Error("Stripe checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, slug, name, whatsapp_number")
    .eq("id", input.intent.tenant_id)
    .maybeSingle();
  if (tenantError || !tenant)
    throw new Error("Tenant not found for Stripe checkout intent.");

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_account_id: payload.customerAccountId || null,
      customer_address:
        payload.orderType === "collection"
          ? null
          : payload.customerAddress || null,
      order_type: payload.orderType,
      status: "new",
      total: payload.total,
      order_flow: payload.preorder?.order_flow ?? "standard",
      preorder_status: payload.preorder?.preorder_status ?? null,
      preorder_deposit_percent: payload.preorder?.preorder_deposit_percent ?? null,
      preorder_deposit_amount: payload.preorder?.preorder_deposit_amount ?? 0,
      preorder_balance_amount: payload.preorder?.preorder_balance_amount ?? 0,
      preorder_balance_payment_status: payload.preorder?.preorder_balance_payment_status ?? "not_applicable",
      subtotal_total: payload.rewards?.subtotal_total ?? payload.total,
      reward_tier: payload.rewards?.reward_tier ?? null,
      reward_discount_percent: payload.rewards?.reward_discount_percent ?? 0,
      reward_discount_amount: payload.rewards?.reward_discount_amount ?? 0,
      discount_rule_id: payload.discounts?.discount_rule_id ?? null,
      discount_code: payload.discounts?.discount_code ?? null,
      discount_name: payload.discounts?.discount_name ?? null,
      discount_scope: payload.discounts?.discount_scope ?? null,
      discount_type: payload.discounts?.discount_type ?? null,
      discount_value: payload.discounts?.discount_value ?? 0,
      discount_base_amount: payload.discounts?.discount_base_amount ?? 0,
      discount_amount: payload.discounts?.discount_amount ?? 0,
      discount_allow_with_rewards:
        payload.discounts?.discount_allow_with_rewards ?? true,
      discount_only_this_discount:
        payload.discounts?.discount_only_this_discount ?? false,
      rewards_spend_before: payload.rewards?.rewards_spend_before ?? null,
      rewards_spend_after: payload.rewards?.rewards_spend_after ?? null,
      notes: payload.notes || null,
      payment_provider: "stripe",
      payment_method_label: payload.paymentMethodLabel || "Stripe card payment",
      payment_status: "paid",
      payment_checkout_session_id:
        input.sessionId || input.intent.stripe_checkout_session_id || null,
      payment_intent_id:
        input.paymentIntentId || input.intent.stripe_payment_intent_id || null,
      payment_reference:
        input.paymentReference ||
        input.paymentIntentId ||
        input.sessionId ||
        null,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order)
    throw new Error(
      "Could not create paid storefront order after Stripe payment.",
    );

  const orderItems = payload.items.map((item) => ({
    ...item,
    order_id: order.id,
  }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError)
    throw new Error("Could not create order items after Stripe payment.");

  await reduceStockAfterPaidOrder(tenant.id, payload.items);

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const message = buildWhatsAppOrderMessage({
    tenantName: branding.displayName,
    order,
    ...branding,
    items: payload.items.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      line_total: item.line_total,
    })),
    payment: {
      label: payload.paymentMethodLabel || "Paid by card",
      status: "paid",
      reference:
        input.paymentReference ||
        input.paymentIntentId ||
        input.sessionId ||
        null,
    },
  });

  await db
    .from("orders")
    .update({ whatsapp_message: message })
    .eq("id", order.id)
    .eq("tenant_id", tenant.id);

  await Promise.allSettled([
    enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId: order.id,
      audience: "admin",
      eventType: "new_order",
      title: "Paid order received",
      body: `${payload.customerName} paid securely by card for a ${payload.orderType} order.`,
      payload: { orderId: order.id, route: "/admin/orders" },
    }),
    enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId: order.id,
      audience: "customer",
      eventType: "order_received",
      title: "Payment received",
      body: "Your order has been paid and sent to the store.",
      payload: { orderId: order.id, status: "new" },
    }),
    sendAdminPushForTenant(tenant.id, {
      title: "Paid order received",
      body: `${payload.customerName} paid securely by card for a ${payload.orderType} order.`,
      url: "/admin/orders",
      tag: `orduva-order-${order.id}`,
    }),
  ]);

  await db
    .from("storefront_payment_intents")
    .update({
      status: "paid",
      order_id: order.id,
      stripe_checkout_session_id:
        input.sessionId || input.intent.stripe_checkout_session_id || null,
      stripe_payment_intent_id:
        input.paymentIntentId || input.intent.stripe_payment_intent_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.intent.id)
    .eq("tenant_id", tenant.id);

  return order.id as string;
}

async function markIntentStatus(input: {
  intent: Record<string, any> | null;
  status: string;
  sessionId?: string | null;
  paymentIntentId?: string | null;
}) {
  if (!input.intent?.id) return;
  await db
    .from("storefront_payment_intents")
    .update({
      status: input.status,
      stripe_checkout_session_id:
        input.sessionId || input.intent.stripe_checkout_session_id || null,
      stripe_payment_intent_id:
        input.paymentIntentId || input.intent.stripe_payment_intent_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id);
}

export async function processTenantStripeWebhook(event: StripeEvent) {
  const object = (event.data?.object || {}) as Record<string, any>;
  const metadata = (object.metadata || {}) as Record<string, any>;
  const tenantId = getString(metadata.tenant_id);
  const checkoutId = readCheckoutIdFromObject(object);
  const sessionId = event.type.startsWith("checkout.session")
    ? getString(object.id)
    : getString(metadata.checkout_session_id);
  const paymentIntentId = event.type.startsWith("payment_intent")
    ? getString(object.id)
    : getString(object.payment_intent);
  const intent = await loadIntentByCheckout({
    checkoutId,
    sessionId,
    paymentIntentId,
    tenantId,
  });

  switch (event.type) {
    case "checkout.session.completed":
      await createPaidOrderFromIntent({
        intent: intent || {},
        sessionId: getString(object.id),
        paymentIntentId: getString(object.payment_intent),
        paymentReference:
          getString(object.payment_intent) || getString(object.id),
        paidAt: new Date().toISOString(),
      });
      return "Storefront Stripe checkout completed, paid order created, and stock reduced.";
    case "checkout.session.expired":
      await markIntentStatus({
        intent,
        status: "cancelled",
        sessionId: getString(object.id),
      });
      return "Storefront Stripe checkout expired. No order was created.";
    case "payment_intent.succeeded":
      if (intent && !intent.order_id) {
        await createPaidOrderFromIntent({
          intent,
          paymentIntentId: getString(object.id),
          paymentReference: getString(object.id),
          paidAt: new Date().toISOString(),
        });
        return "Storefront Stripe payment intent succeeded, paid order created, and stock reduced.";
      }
      await markIntentStatus({
        intent,
        status: "paid",
        paymentIntentId: getString(object.id),
      });
      return "Storefront Stripe payment intent succeeded.";
    case "payment_intent.payment_failed":
      await markIntentStatus({
        intent,
        status: "failed",
        paymentIntentId: getString(object.id),
      });
      return "Storefront Stripe payment intent failed. No order was created.";
    case "charge.refunded":
      await markIntentStatus({
        intent,
        status: "refunded",
        paymentIntentId: getString(object.payment_intent),
      });
      if (intent?.order_id) {
        await db
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("id", intent.order_id)
          .eq("tenant_id", intent.tenant_id);
      }
      return "Storefront Stripe charge refunded.";
    default:
      return `Storefront Stripe event ignored: ${event.type}`;
  }
}
