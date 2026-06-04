import crypto from "crypto";
import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant } from "@/lib/web-push";

export type TenantYocoCustomerSettings = {
  tenant_id: string;
  enable_yoco_customer_payments: boolean | null;
  yoco_connection_status: string | null;
  yoco_customer_mode: string | null;
  yoco_customer_secret_key: string | null;
  yoco_customer_webhook_secret: string | null;
  yoco_customer_webhook_id?: string | null;
  yoco_customer_webhook_url?: string | null;
  yoco_customer_account_label: string | null;
  yoco_customer_payments_live: boolean | null;
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
  currencyCode: string;
  paymentProvider: "yoco";
  paymentMethodLabel: string;
  rewards?: RewardOrderMetadata | null;
  discounts?: DiscountOrderMetadata | null;
  items: Array<{
    product_id: string;
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

type YocoCheckoutResponse = {
  id?: string;
  checkoutId?: string;
  redirectUrl?: string;
  redirect_url?: string;
  status?: string;
  paymentId?: string;
  payment_id?: string;
  error?: { message?: string };
  message?: string;
};

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function configured(status: string | null | undefined) {
  return status === "configured" || status === "connected" || status === "active";
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function storefrontReturnOrigin(req: Request, tenantSlug: string) {
  const requestOrigin = originFromRequest(req);
  try {
    const host = new URL(requestOrigin).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return requestOrigin;
  } catch {
    // Fall through to the canonical tenant storefront host.
  }
  return `https://${tenantSlug}.orduva.com`;
}

function toYocoAmountCents(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function yocoApiBase() {
  return "https://payments.yoco.com";
}

function isPaidStatus(status: string | null | undefined) {
  const value = String(status || "").trim().toLowerCase();
  return ["paid", "succeeded", "successful", "completed", "complete", "payment_succeeded"].includes(value);
}

function isFailedStatus(status: string | null | undefined) {
  const value = String(status || "").trim().toLowerCase();
  return ["failed", "cancelled", "canceled", "expired", "payment_failed"].includes(value);
}

export async function loadTenantYocoCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_yoco_customer_payments, yoco_connection_status, yoco_customer_mode, yoco_customer_secret_key, yoco_customer_webhook_secret, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_account_label, yoco_customer_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load tenant Yoco settings.");
  return (data || null) as TenantYocoCustomerSettings | null;
}

export function assertTenantYocoReady(settings: TenantYocoCustomerSettings | null, currencyCode: string) {
  if (String(currencyCode || "").toUpperCase() !== "ZAR") throw new Error("Yoco checkout is currently only available for ZAR stores.");
  if (!settings) throw new Error("Yoco is not configured for this store.");
  if (settings.enable_yoco_customer_payments !== true) throw new Error("Yoco customer payments are not enabled for this store.");
  if (!configured(settings.yoco_connection_status)) throw new Error("Yoco is not marked as connected for this store.");
  if (settings.yoco_customer_payments_live !== true) throw new Error("Yoco customer payments are not live for this store yet.");
  if (!getString(settings.yoco_customer_secret_key)) throw new Error("Tenant Yoco secret key is missing.");
}

export async function createTenantYocoOrderCheckoutIntent(input: {
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
  currencyCode: string;
  paymentMethodLabel: string;
  rewards?: RewardOrderMetadata | null;
  discounts?: DiscountOrderMetadata | null;
}) {
  const currencyCode = String(input.currencyCode || "ZAR").toUpperCase();
  const yocoSettings = await loadTenantYocoCustomerSettings(input.tenantId);
  assertTenantYocoReady(yocoSettings, currencyCode);

  const payload: PendingOrderPayload = {
    tenantSlug: input.tenantSlug,
    tenantName: input.tenantName,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAccountId: input.customerAccountId,
    customerAddress: input.customerAddress,
    orderType: input.orderType,
    notes: input.notes,
    total: input.total,
    currencyCode,
    paymentProvider: "yoco",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    discounts: input.discounts || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "yoco",
      status: "created",
      amount_total: input.total,
      currency_code: currencyCode,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      order_payload: payload,
    })
    .select("id")
    .single();

  if (intentError || !intent?.id) throw new Error("Could not prepare Yoco checkout.");

  const checkoutId = String(intent.id);
  const secretKey = getString(yocoSettings?.yoco_customer_secret_key);
  const amountCents = toYocoAmountCents(input.total);
  if (amountCents < 200) throw new Error("Order total is too small for Yoco Checkout. The minimum card payment is R2.00.");

  const origin = storefrontReturnOrigin(input.req, input.tenantSlug);
  const successUrl = `${origin}/checkout/payment/yoco/success?checkout_id=${encodeURIComponent(checkoutId)}`;
  const cancelUrl = `${origin}/checkout/payment/yoco/cancel?checkout_id=${encodeURIComponent(checkoutId)}`;
  const failureUrl = `${origin}/checkout/payment/yoco/failure?checkout_id=${encodeURIComponent(checkoutId)}`;

  const response = await fetch(`${yocoApiBase()}/api/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: currencyCode,
      cancelUrl,
      successUrl,
      failureUrl,
      metadata: {
        orduva_flow: "storefront_order_checkout",
        tenant_id: input.tenantId,
        tenant_slug: input.tenantSlug,
        checkout_id: checkoutId,
        checkoutId,
        orduva_checkout_id: checkoutId,
        tenantId: input.tenantId,
        customer_name: input.customerName.slice(0, 120),
        customer_phone: input.customerPhone.slice(0, 80),
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as YocoCheckoutResponse | null;
  const yocoCheckoutId = getString(data?.id) || getString(data?.checkoutId);
  const redirectUrl = getString(data?.redirectUrl) || getString(data?.redirect_url);

  if (!response.ok || !yocoCheckoutId || !redirectUrl) {
    await db.from("storefront_payment_intents").update({ status: "failed" }).eq("id", checkoutId).eq("tenant_id", input.tenantId);
    throw new Error(data?.error?.message || data?.message || `Tenant Yoco checkout failed with status ${response.status}`);
  }

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      yoco_checkout_id: yocoCheckoutId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return {
    checkoutId,
    yocoCheckoutId,
    url: redirectUrl,
  };
}

export async function loadYocoIntentByCheckout(input: { checkoutId?: string | null; yocoCheckoutId?: string | null }) {
  let query = db
    .from("storefront_payment_intents")
    .select("id,status,order_id,tenant_id,yoco_checkout_id,yoco_payment_id,order_payload,amount_total,currency_code,updated_at");

  if (input.yocoCheckoutId) query = query.eq("yoco_checkout_id", input.yocoCheckoutId);
  else if (input.checkoutId) query = query.eq("id", input.checkoutId);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load Yoco checkout intent.");
  return data as Record<string, any> | null;
}

export async function fetchYocoCheckoutStatus(input: { intent: Record<string, any> }) {
  const yocoCheckoutId = getString(input.intent.yoco_checkout_id);
  if (!yocoCheckoutId) return { status: input.intent.status || "created", paymentId: null as string | null };

  const settings = await loadTenantYocoCustomerSettings(String(input.intent.tenant_id));
  const secretKey = getString(settings?.yoco_customer_secret_key);
  if (!secretKey) return { status: input.intent.status || "created", paymentId: null as string | null };

  const response = await fetch(`${yocoApiBase()}/api/checkouts/${encodeURIComponent(yocoCheckoutId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as YocoCheckoutResponse | null;
  if (!response.ok) return { status: input.intent.status || "checkout_started", paymentId: null as string | null };

  return {
    status: getString(data?.status) || input.intent.status || "checkout_started",
    paymentId: getString(data?.paymentId) || getString(data?.payment_id) || null,
  };
}

function reduceVariantStock(productVariants: any[], variantId: string, quantity: number) {
  return productVariants.map((variant: any) => {
    if (variant?.id !== variantId || variant?.stockEnabled !== true) return variant;
    const currentStock = Math.max(0, Math.floor(Number(variant.stockQuantity || 0)));
    return { ...variant, stockQuantity: Math.max(0, currentStock - quantity) };
  });
}

async function reduceStockAfterPaidOrder(tenantId: string, items: PendingOrderPayload["items"]) {
  const quantityBySellableLine = new Map<string, number>();
  for (const item of items) {
    const productId = String(item.product_id || "");
    if (!productId) continue;
    const variantId = item.variant_id ? String(item.variant_id) : "base";
    const lineKey = `${productId}::${variantId}`;
    quantityBySellableLine.set(lineKey, (quantityBySellableLine.get(lineKey) || 0) + Number(item.quantity || 0));
  }

  for (const [lineKey, quantity] of quantityBySellableLine.entries()) {
    const [productId, variantId] = lineKey.split("::");
    const { data: product, error } = await db
      .from("products")
      .select("id, stock_enabled, stock_quantity, product_variants, product_type, custom_amount_enabled")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error || !product) continue;
    if ((product as any).product_type === "customer_amount" || (product as any).custom_amount_enabled === true) continue;

    if (variantId && variantId !== "base") {
      const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
      const selectedVariant = variants.find((variant: any) => variant?.id === variantId);
      if (!selectedVariant?.stockEnabled) continue;
      const nextVariants = reduceVariantStock(variants, variantId, quantity);
      const { error: stockError } = await db
        .from("products")
        .update({ product_variants: nextVariants })
        .eq("id", product.id)
        .eq("tenant_id", tenantId);
      if (stockError) console.error("Failed to reduce variant stock after Yoco payment", stockError);
      continue;
    }

    if (!product.stock_enabled) continue;
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - quantity);
    const { error: stockError } = await db
      .from("products")
      .update({ stock_quantity: nextStock })
      .eq("id", product.id)
      .eq("tenant_id", tenantId);
    if (stockError) console.error("Failed to reduce product stock after Yoco payment", stockError);
  }
}
export async function createPaidOrderFromYocoIntent(input: {
  intent: Record<string, any>;
  paymentReference?: string | null;
  paymentId?: string | null;
  paidAt?: string | null;
}) {
  if (!input.intent?.id) throw new Error("Missing Yoco checkout intent.");
  if (input.intent.order_id) return input.intent.order_id as string;

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started"])
    .select("id,status,order_id,tenant_id,yoco_checkout_id,yoco_payment_id,order_payload,amount_total,currency_code")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim Yoco checkout intent.");
  if (!claimedIntent) {
    const latest = await loadYocoIntentByCheckout({ checkoutId: input.intent.id });
    if (latest?.order_id) return latest.order_id as string;
    return input.intent.order_id as string;
  }

  input.intent = claimedIntent;
  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length) throw new Error("Yoco checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, slug, name, whatsapp_number")
    .eq("id", input.intent.tenant_id)
    .maybeSingle();
  if (tenantError || !tenant) throw new Error("Tenant not found for Yoco checkout intent.");

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_account_id: payload.customerAccountId || null,
      customer_address: payload.orderType === "collection" ? null : payload.customerAddress || null,
      order_type: payload.orderType,
      status: "new",
      total: payload.total,
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
      discount_allow_with_rewards: payload.discounts?.discount_allow_with_rewards ?? true,
      discount_only_this_discount: payload.discounts?.discount_only_this_discount ?? false,
      rewards_spend_before: payload.rewards?.rewards_spend_before ?? null,
      rewards_spend_after: payload.rewards?.rewards_spend_after ?? null,
      notes: payload.notes || null,
      payment_provider: "yoco",
      payment_method_label: payload.paymentMethodLabel || "Yoco card payment",
      payment_status: "paid",
      payment_checkout_session_id: input.intent.yoco_checkout_id || input.intent.id || null,
      payment_intent_id: input.paymentId || input.intent.yoco_payment_id || null,
      payment_reference: input.paymentReference || input.paymentId || input.intent.yoco_checkout_id || null,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Could not create paid storefront order after Yoco payment.");

  const orderItems = payload.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) throw new Error("Could not create order items after Yoco payment.");

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
      reference: input.paymentReference || input.paymentId || input.intent.yoco_checkout_id || null,
    },
  });

  await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

  await Promise.allSettled([
    enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId: order.id,
      audience: "admin",
      eventType: "new_order",
      title: "Paid order received",
      body: `${payload.customerName} paid by Yoco for a ${payload.orderType} order.`,
      payload: { orderId: order.id, route: "/admin/orders" },
    }),
    enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId: order.id,
      audience: "customer",
      eventType: "order_received",
      title: "Payment received",
      body: "Your Yoco payment has been received and the order has been sent to the store.",
      payload: { orderId: order.id, status: "new" },
    }),
    sendAdminPushForTenant(tenant.id, {
      title: "Paid order received",
      body: `${payload.customerName} paid by Yoco for a ${payload.orderType} order.`,
      url: "/admin/orders",
      tag: `orduva-order-${order.id}`,
    }),
  ]);

  await db
    .from("storefront_payment_intents")
    .update({
      status: "paid",
      order_id: order.id,
      yoco_payment_id: input.paymentId || input.intent.yoco_payment_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.intent.id)
    .eq("tenant_id", tenant.id);

  return order.id as string;
}

export async function reconcileYocoIntent(input: { checkoutId?: string | null; yocoCheckoutId?: string | null }) {
  const intent = await loadYocoIntentByCheckout(input);
  if (!intent) return null;
  if (intent.order_id) return { intent, status: "paid", orderId: intent.order_id as string, paymentId: getString(intent.yoco_payment_id) || null };

  const yocoStatus = await fetchYocoCheckoutStatus({ intent });

  if (isPaidStatus(yocoStatus.status)) {
    const orderId = await createPaidOrderFromYocoIntent({
      intent,
      paymentId: yocoStatus.paymentId,
      paymentReference: yocoStatus.paymentId || getString(intent.yoco_checkout_id) || getString(intent.id),
      paidAt: new Date().toISOString(),
    });
    return { intent: { ...intent, order_id: orderId }, status: "paid", orderId, paymentId: yocoStatus.paymentId };
  }

  if (isFailedStatus(yocoStatus.status)) {
    await db
      .from("storefront_payment_intents")
      .update({ status: yocoStatus.status.toLowerCase().includes("cancel") ? "cancelled" : "failed", updated_at: new Date().toISOString() })
      .eq("id", intent.id)
      .eq("tenant_id", intent.tenant_id)
      .is("order_id", null);
  }

  return { intent, status: yocoStatus.status || intent.status || "checkout_started", orderId: null as string | null, paymentId: yocoStatus.paymentId };
}


type YocoWebhookEnvelope = {
  id?: string;
  type?: string;
  event?: string;
  name?: string;
  mode?: string;
  data?: Record<string, any>;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  [key: string]: any;
};

type VerifiedYocoWebhook = {
  event: YocoWebhookEnvelope;
  webhookId: string;
  eventId: string;
  tenantId: string | null;
  checkoutId: string | null;
  yocoCheckoutId: string | null;
  paymentId: string | null;
  eventType: string;
};

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseYocoWebhookSignatures(header: string | null) {
  if (!header) return [];
  return header
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [, signature] = part.split(",");
      return getString(signature || part);
    })
    .filter(Boolean);
}

function verifyYocoSignature(rawBody: string, headers: Headers, webhookSecret: string) {
  const webhookId = getString(headers.get("webhook-id"));
  const timestamp = getString(headers.get("webhook-timestamp"));
  const signatureHeader = headers.get("webhook-signature");
  if (!webhookId || !timestamp || !signatureHeader) throw new Error("Missing Yoco webhook signature headers.");

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) throw new Error("Invalid Yoco webhook timestamp.");
  const timestampMs = timestampNumber > 10_000_000_000 ? timestampNumber : timestampNumber * 1000;
  const ageMs = Math.abs(Date.now() - timestampMs);
  if (ageMs > 3 * 60 * 1000) throw new Error("Yoco webhook timestamp is outside the allowed 3 minute window.");

  const rawSecret = getString(webhookSecret);
  if (!rawSecret.startsWith("whsec_")) throw new Error("Invalid Yoco webhook secret format.");
  const secretPart = rawSecret.split("_")[1] || "";
  const secretBytes = Buffer.from(secretPart, "base64");
  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const signatures = parseYocoWebhookSignatures(signatureHeader);
  if (!signatures.some((signature) => timingSafeEqualText(expected, signature))) {
    throw new Error("Yoco webhook signature verification failed.");
  }
}

function walkObject(value: unknown, visitor: (key: string, value: unknown) => string | null): string | null {
  if (!value || typeof value !== "object") return null;
  const stack: Array<Record<string, unknown>> = [value as Record<string, unknown>];
  const seen = new Set<Record<string, unknown>>();
  while (stack.length) {
    const current = stack.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const [key, child] of Object.entries(current)) {
      const found = visitor(key, child);
      if (found) return found;
      if (child && typeof child === "object" && !Array.isArray(child)) stack.push(child as Record<string, unknown>);
    }
  }
  return null;
}

function findDeepString(value: unknown, keys: string[]) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  return walkObject(value, (key, child) => wanted.has(key.toLowerCase()) ? getString(child) || null : null);
}

function extractYocoWebhookRefs(event: YocoWebhookEnvelope) {
  const eventType = getString(event.type) || getString(event.event) || getString(event.name) || "unknown";
  const metadataCheckoutId = findDeepString(event, ["orduva_checkout_id", "checkoutId", "checkout_id"]);
  const tenantId = findDeepString(event, ["tenantId", "tenant_id"]);
  const yocoCheckoutId = findDeepString(event, ["yoco_checkout_id", "yocoCheckoutId", "checkoutId", "checkout_id"]);
  const paymentId = findDeepString(event, ["paymentId", "payment_id", "paymentID", "id"]);
  return {
    eventType,
    tenantId,
    checkoutId: metadataCheckoutId,
    yocoCheckoutId: yocoCheckoutId && yocoCheckoutId !== metadataCheckoutId ? yocoCheckoutId : null,
    paymentId,
  };
}

async function loadYocoWebhookSecretForEvent(event: YocoWebhookEnvelope) {
  const refs = extractYocoWebhookRefs(event);
  if (refs.tenantId) {
    const settings = await loadTenantYocoCustomerSettings(refs.tenantId);
    const secret = getString(settings?.yoco_customer_webhook_secret);
    if (!secret) throw new Error("Tenant Yoco webhook secret is not configured.");
    return { secret, tenantId: refs.tenantId, refs };
  }

  const intent = refs.checkoutId || refs.yocoCheckoutId
    ? await loadYocoIntentByCheckout({ checkoutId: refs.checkoutId, yocoCheckoutId: refs.yocoCheckoutId })
    : null;
  if (intent?.tenant_id) {
    const settings = await loadTenantYocoCustomerSettings(String(intent.tenant_id));
    const secret = getString(settings?.yoco_customer_webhook_secret);
    if (!secret) throw new Error("Tenant Yoco webhook secret is not configured.");
    return { secret, tenantId: String(intent.tenant_id), refs: { ...refs, checkoutId: refs.checkoutId || getString(intent.id), yocoCheckoutId: refs.yocoCheckoutId || getString(intent.yoco_checkout_id) } };
  }

  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, yoco_customer_webhook_secret")
    .not("yoco_customer_webhook_secret", "is", null);
  if (error || !data?.length) throw new Error("No tenant Yoco webhook secrets are available for verification.");

  return { secret: "", tenantId: null, refs };
}

export async function verifyAndParseTenantYocoWebhook(rawBody: string, headers: Headers): Promise<VerifiedYocoWebhook> {
  const event = JSON.parse(rawBody) as YocoWebhookEnvelope;
  const webhookId = getString(headers.get("webhook-id"));
  const eventId = getString(event.id) || webhookId || crypto.createHash("sha256").update(rawBody).digest("hex");
  const loaded = await loadYocoWebhookSecretForEvent(event);

  if (loaded.secret) {
    verifyYocoSignature(rawBody, headers, loaded.secret);
    return {
      event,
      webhookId,
      eventId,
      tenantId: loaded.tenantId,
      checkoutId: loaded.refs.checkoutId || null,
      yocoCheckoutId: loaded.refs.yocoCheckoutId || null,
      paymentId: loaded.refs.paymentId || null,
      eventType: loaded.refs.eventType,
    };
  }

  const { data } = await db
    .from("tenant_settings")
    .select("tenant_id, yoco_customer_webhook_secret")
    .not("yoco_customer_webhook_secret", "is", null);
  for (const row of (data || []) as Array<{ tenant_id: string; yoco_customer_webhook_secret: string | null }>) {
    const secret = getString(row.yoco_customer_webhook_secret);
    if (!secret) continue;
    try {
      verifyYocoSignature(rawBody, headers, secret);
      return {
        event,
        webhookId,
        eventId,
        tenantId: row.tenant_id,
        checkoutId: loaded.refs.checkoutId || null,
        yocoCheckoutId: loaded.refs.yocoCheckoutId || null,
        paymentId: loaded.refs.paymentId || null,
        eventType: loaded.refs.eventType,
      };
    } catch {
      // Try next tenant webhook secret.
    }
  }

  throw new Error("Yoco webhook signature verification failed for all tenant secrets.");
}

function webhookLooksPaid(event: YocoWebhookEnvelope, eventType: string) {
  const haystack = [eventType, findDeepString(event, ["status", "paymentStatus", "checkoutStatus"])].filter(Boolean).join(" ").toLowerCase();
  return ["paid", "succeeded", "successful", "completed", "payment_succeeded", "payment.succeeded", "checkout.succeeded", "checkout.completed"].some((word) => haystack.includes(word));
}

function webhookLooksFailed(event: YocoWebhookEnvelope, eventType: string) {
  const haystack = [eventType, findDeepString(event, ["status", "paymentStatus", "checkoutStatus"])].filter(Boolean).join(" ").toLowerCase();
  return ["failed", "cancelled", "canceled", "expired", "payment.failed", "checkout.failed", "checkout.cancelled", "checkout.canceled"].some((word) => haystack.includes(word));
}

function asUuid(value: string | null | undefined) {
  const text = getString(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

async function recordYocoWebhookEvent(input: VerifiedYocoWebhook, status: "processing" | "processed" | "ignored" | "failed", message?: string) {
  const row = {
    event_id: input.eventId,
    webhook_id: input.webhookId || null,
    tenant_id: input.tenantId,
    checkout_id: asUuid(input.checkoutId),
    yoco_checkout_id: input.yocoCheckoutId,
    yoco_payment_id: input.paymentId,
    event_type: input.eventType,
    status,
    message: message || null,
    payload: input.event as Record<string, any>,
    processed_at: status === "processed" || status === "ignored" ? new Date().toISOString() : null,
  };
  const { data, error } = await db
    .from("storefront_yoco_webhook_events")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    const code = String((error as any).code || "");
    const msg = String((error as any).message || "").toLowerCase();
    if (code === "23505" || msg.includes("duplicate")) return { duplicate: true };
    throw new Error("Could not record Yoco webhook event. Run the Ver-0.213 Supabase SQL first.");
  }
  return { duplicate: false, id: data?.id as string | undefined };
}

async function finishYocoWebhookEvent(eventId: string, status: "processed" | "ignored" | "failed", message: string) {
  await db
    .from("storefront_yoco_webhook_events")
    .update({ status, message, processed_at: new Date().toISOString() })
    .eq("event_id", eventId);
}

export async function processTenantYocoWebhook(input: VerifiedYocoWebhook) {
  const claim = await recordYocoWebhookEvent(input, "processing");
  if (claim.duplicate) return "Yoco webhook event already processed or currently processing.";

  try {
    let intent = await loadYocoIntentByCheckout({ checkoutId: input.checkoutId, yocoCheckoutId: input.yocoCheckoutId });
    if (!intent && input.tenantId && input.yocoCheckoutId) {
      intent = await loadYocoIntentByCheckout({ yocoCheckoutId: input.yocoCheckoutId });
    }

    if (!intent) {
      const message = "Yoco webhook verified but did not match an Orduva checkout intent.";
      await finishYocoWebhookEvent(input.eventId, "ignored", message);
      return message;
    }

    if (webhookLooksPaid(input.event, input.eventType)) {
      const orderId = await createPaidOrderFromYocoIntent({
        intent,
        paymentId: input.paymentId || getString(intent.yoco_payment_id) || null,
        paymentReference: input.paymentId || input.yocoCheckoutId || input.checkoutId || input.eventId,
        paidAt: new Date().toISOString(),
      });
      const message = `Yoco webhook confirmed payment. Paid order ${orderId} is ready.`;
      await finishYocoWebhookEvent(input.eventId, "processed", message);
      return message;
    }

    if (webhookLooksFailed(input.event, input.eventType)) {
      await db
        .from("storefront_payment_intents")
        .update({ status: input.eventType.toLowerCase().includes("cancel") ? "cancelled" : "failed", updated_at: new Date().toISOString() })
        .eq("id", intent.id)
        .eq("tenant_id", intent.tenant_id)
        .is("order_id", null);
      const message = `Yoco webhook marked checkout as ${input.eventType}. No paid order was created.`;
      await finishYocoWebhookEvent(input.eventId, "processed", message);
      return message;
    }

    const message = `Yoco webhook ignored: ${input.eventType}`;
    await finishYocoWebhookEvent(input.eventId, "ignored", message);
    return message;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yoco webhook processing failed.";
    await finishYocoWebhookEvent(input.eventId, "failed", message);
    throw error;
  }
}
