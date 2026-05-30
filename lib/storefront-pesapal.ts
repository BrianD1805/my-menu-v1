import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant } from "@/lib/web-push";

export type TenantPesapalCustomerSettings = {
  tenant_id: string;
  enable_mpesa_customer_payments: boolean | null;
  mpesa_connection_status: string | null;
  mpesa_customer_mode: string | null;
  mpesa_customer_consumer_key: string | null;
  mpesa_customer_consumer_secret: string | null;
  mpesa_customer_ipn_id: string | null;
  mpesa_customer_account_label: string | null;
  mpesa_customer_setup_notes: string | null;
  mpesa_customer_payments_live: boolean | null;
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
  paymentProvider: "mpesa";
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
  }>;
};

type PesapalTokenResponse = {
  token?: string;
  expiryDate?: string;
  error?: { message?: string } | null;
  status?: string | number;
  message?: string;
};

type PesapalSubmitOrderResponse = {
  order_tracking_id?: string;
  merchant_reference?: string;
  redirect_url?: string;
  error?: { message?: string } | null;
  status?: string | number;
  message?: string;
};

export type PesapalStatusResponse = {
  payment_method?: string;
  confirmation_code?: string;
  payment_status_description?: string;
  status_code?: string | number;
  merchant_reference?: string;
  currency?: string;
  amount?: number;
  description?: string;
  message?: string;
  error?: { message?: string } | null;
};

export function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function configured(status: string | null | undefined) {
  return status === "configured" || status === "connected" || status === "active";
}

function pesapalApiBase(mode: string | null | undefined) {
  return mode === "live" ? "https://pay.pesapal.com/v3/api" : "https://cybqa.pesapal.com/pesapalv3/api";
}

function allowPesapalSandboxHostedCheckout() {
  return String(process.env.ORDUVA_ALLOW_PESAPAL_SANDBOX_CHECKOUTS || "").trim().toLowerCase() === "true";
}

function isPesapalSandboxMode(mode: string | null | undefined) {
  return String(mode || "test").trim().toLowerCase() !== "live";
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
    // Fall through to canonical tenant host.
  }
  return `https://${tenantSlug}.orduva.com`;
}

function firstLastName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "Customer", lastName: parts.slice(1).join(" ") || "" };
}

function safeMerchantReference(checkoutId: string) {
  return `ORDUVA-${checkoutId.replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 42)}`.slice(0, 50);
}

export function isCompletedStatus(value: string | number | null | undefined) {
  const text = String(value || "").trim().toLowerCase();
  return text === "1" || text === "completed" || text === "complete" || text === "paid" || text === "success" || text === "successful";
}

export function isFailedStatus(value: string | number | null | undefined) {
  const text = String(value || "").trim().toLowerCase();
  return text === "2" || text === "failed" || text === "invalid" || text === "0" || text === "3" || text === "reversed" || text === "cancelled" || text === "canceled";
}

export async function loadTenantPesapalCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_mpesa_customer_payments, mpesa_connection_status, mpesa_customer_mode, mpesa_customer_consumer_key, mpesa_customer_consumer_secret, mpesa_customer_ipn_id, mpesa_customer_account_label, mpesa_customer_setup_notes, mpesa_customer_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load M-Pesa/Pesapal settings.");
  return (data || null) as TenantPesapalCustomerSettings | null;
}

export function assertTenantPesapalReady(settings: TenantPesapalCustomerSettings | null, currencyCode: string) {
  if (String(currencyCode || "").toUpperCase() !== "KES") throw new Error("M-Pesa checkout is currently only available for KES stores.");
  if (!settings) throw new Error("M-Pesa/Pesapal is not configured for this store.");
  if (settings.enable_mpesa_customer_payments !== true) throw new Error("M-Pesa customer payments are not enabled for this store.");
  if (!configured(settings.mpesa_connection_status)) throw new Error("M-Pesa/Pesapal is not marked as connected for this store.");
  if (settings.mpesa_customer_payments_live !== true) throw new Error("M-Pesa customer payments are not live for this store yet.");
  if (!getString(settings.mpesa_customer_consumer_key)) throw new Error("Tenant Pesapal consumer key is missing.");
  if (!getString(settings.mpesa_customer_consumer_secret)) throw new Error("Tenant Pesapal consumer secret is missing.");
  if (!getString(settings.mpesa_customer_ipn_id)) throw new Error("Tenant Pesapal IPN notification ID is missing.");
  if (isPesapalSandboxMode(settings.mpesa_customer_mode) && !allowPesapalSandboxHostedCheckout()) {
    throw new Error("Pesapal sandbox checkout is safety-blocked because sandbox M-Pesa may still debit a real phone wallet. Use live mode with the tenant's real Pesapal merchant account for controlled low-value tests, or set ORDUVA_ALLOW_PESAPAL_SANDBOX_CHECKOUTS=true only if you deliberately want sandbox hosted checkout exposed.");
  }
}

async function requestPesapalToken(settings: TenantPesapalCustomerSettings) {
  const response = await fetch(`${pesapalApiBase(settings.mpesa_customer_mode)}/Auth/RequestToken`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      consumer_key: getString(settings.mpesa_customer_consumer_key),
      consumer_secret: getString(settings.mpesa_customer_consumer_secret),
    }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as PesapalTokenResponse | null;
  const token = getString(data?.token);
  if (!response.ok || !token) throw new Error(data?.error?.message || data?.message || `Pesapal token request failed with status ${response.status}`);
  return token;
}

export async function createTenantPesapalOrderCheckoutIntent(input: {
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
  const currencyCode = String(input.currencyCode || "KES").toUpperCase();
  const pesapalSettings = await loadTenantPesapalCustomerSettings(input.tenantId);
  assertTenantPesapalReady(pesapalSettings, currencyCode);

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
    paymentProvider: "mpesa",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    discounts: input.discounts || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "mpesa",
      status: "created",
      amount_total: input.total,
      currency_code: currencyCode,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      order_payload: payload,
    })
    .select("id")
    .single();

  if (intentError || !intent?.id) throw new Error("Could not prepare M-Pesa checkout.");

  const checkoutId = String(intent.id);
  const merchantReference = safeMerchantReference(checkoutId);
  const origin = storefrontReturnOrigin(input.req, input.tenantSlug);
  const successUrl = `${origin}/checkout/payment/mpesa/success?checkout_id=${encodeURIComponent(checkoutId)}&merchant_reference=${encodeURIComponent(merchantReference)}`;
  const cancelUrl = `${origin}/checkout/payment/mpesa/cancel?checkout_id=${encodeURIComponent(checkoutId)}&merchant_reference=${encodeURIComponent(merchantReference)}`;
  const { firstName, lastName } = firstLastName(input.customerName);
  const token = await requestPesapalToken(pesapalSettings!);

  const response = await fetch(`${pesapalApiBase(pesapalSettings!.mpesa_customer_mode)}/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      id: merchantReference,
      currency: currencyCode,
      amount: Number(input.total.toFixed(2)),
      description: `Order for ${input.tenantName}`.slice(0, 100),
      callback_url: successUrl,
      cancellation_url: cancelUrl,
      redirect_mode: "TOP_WINDOW",
      notification_id: getString(pesapalSettings!.mpesa_customer_ipn_id),
      branch: input.tenantName.slice(0, 100),
      billing_address: {
        phone_number: input.customerPhone,
        email_address: "",
        country_code: "KE",
        first_name: firstName,
        middle_name: "",
        last_name: lastName,
        line_1: input.customerAddress || "",
        line_2: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: "",
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as PesapalSubmitOrderResponse | null;
  const orderTrackingId = getString(data?.order_tracking_id);
  const redirectUrl = getString(data?.redirect_url);

  if (!response.ok || !orderTrackingId || !redirectUrl) {
    await db.from("storefront_payment_intents").update({ status: "failed" }).eq("id", checkoutId).eq("tenant_id", input.tenantId);
    throw new Error(data?.error?.message || data?.message || `Pesapal checkout failed with status ${response.status}`);
  }

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      pesapal_order_tracking_id: orderTrackingId,
      pesapal_merchant_reference: getString(data?.merchant_reference) || merchantReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return { checkoutId, orderTrackingId, merchantReference, url: redirectUrl };
}

export async function loadPesapalIntentByCheckout(input: { checkoutId?: string | null; orderTrackingId?: string | null; merchantReference?: string | null }) {
  let query = db.from("storefront_payment_intents").select("id,status,order_id,tenant_id,provider,pesapal_order_tracking_id,pesapal_merchant_reference,order_payload,amount_total,currency_code,customer_name,customer_phone,created_at,updated_at");
  if (input.orderTrackingId) query = query.eq("pesapal_order_tracking_id", input.orderTrackingId);
  else if (input.merchantReference) query = query.eq("pesapal_merchant_reference", input.merchantReference);
  else if (input.checkoutId) query = query.eq("id", input.checkoutId);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load M-Pesa checkout intent.");
  return data as Record<string, any> | null;
}

export async function fetchPesapalTransactionStatusDetail(input: { intent: Record<string, any> }) {
  const orderTrackingId = getString(input.intent.pesapal_order_tracking_id);
  if (!orderTrackingId) {
    return {
      ok: false,
      httpStatus: 0,
      status: input.intent.status || "created",
      statusCode: null as string | number | null,
      paymentMethod: null as string | null,
      confirmationCode: null as string | null,
      raw: null as PesapalStatusResponse | null,
      errorMessage: "This payment intent has no Pesapal OrderTrackingId yet.",
    };
  }

  const settings = await loadTenantPesapalCustomerSettings(String(input.intent.tenant_id));
  if (!settings) {
    return {
      ok: false,
      httpStatus: 0,
      status: input.intent.status || "checkout_started",
      statusCode: null as string | number | null,
      paymentMethod: null as string | null,
      confirmationCode: null as string | null,
      raw: null as PesapalStatusResponse | null,
      errorMessage: "Tenant M-Pesa/Pesapal settings could not be loaded.",
    };
  }

  const token = await requestPesapalToken(settings);
  const response = await fetch(`${pesapalApiBase(settings.mpesa_customer_mode)}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as PesapalStatusResponse | null;
  const status = getString(data?.payment_status_description) || getString(data?.status_code) || input.intent.status || "checkout_started";
  return {
    ok: response.ok,
    httpStatus: response.status,
    status,
    statusCode: data?.status_code ?? null,
    paymentMethod: getString(data?.payment_method) || null,
    confirmationCode: getString(data?.confirmation_code) || null,
    raw: data,
    errorMessage: getString(data?.error?.message) || getString(data?.message) || (!response.ok ? `Pesapal status check returned HTTP ${response.status}` : null),
  };
}

export async function fetchPesapalTransactionStatus(input: { intent: Record<string, any> }) {
  const detail = await fetchPesapalTransactionStatusDetail(input);
  return {
    status: detail.status,
    statusCode: detail.statusCode,
    paymentMethod: detail.paymentMethod,
    confirmationCode: detail.confirmationCode,
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
      .select("id, stock_enabled, stock_quantity, product_variants")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error || !product) continue;

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
      if (stockError) console.error("Failed to reduce variant stock after Pesapal payment", stockError);
      continue;
    }

    if (!product.stock_enabled) continue;
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - quantity);
    const { error: stockError } = await db
      .from("products")
      .update({ stock_quantity: nextStock })
      .eq("id", product.id)
      .eq("tenant_id", tenantId);
    if (stockError) console.error("Failed to reduce product stock after Pesapal payment", stockError);
  }
}
export async function createPaidOrderFromPesapalIntent(input: { intent: Record<string, any>; paymentReference?: string | null; paymentId?: string | null; paidAt?: string | null; paymentMethod?: string | null }) {
  if (!input.intent?.id) throw new Error("Missing M-Pesa checkout intent.");
  if (input.intent.order_id) return input.intent.order_id as string;

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started"])
    .select("id,status,order_id,tenant_id,provider,pesapal_order_tracking_id,pesapal_merchant_reference,order_payload,amount_total,currency_code,customer_name,customer_phone,created_at,updated_at")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim M-Pesa checkout intent.");
  if (!claimedIntent) {
    const latest = await loadPesapalIntentByCheckout({ checkoutId: input.intent.id });
    if (latest?.order_id) return latest.order_id as string;
    return input.intent.order_id as string;
  }

  input.intent = claimedIntent;
  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length) throw new Error("M-Pesa checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db.from("tenants").select("id, slug, name, whatsapp_number").eq("id", input.intent.tenant_id).maybeSingle();
  if (tenantError || !tenant) throw new Error("Tenant not found for M-Pesa checkout intent.");

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
      payment_provider: "mpesa",
      payment_method_label: payload.paymentMethodLabel || "M-Pesa payment",
      payment_status: "paid",
      payment_checkout_session_id: input.intent.pesapal_order_tracking_id || input.intent.id || null,
      payment_intent_id: input.paymentId || input.intent.pesapal_order_tracking_id || null,
      payment_reference: input.paymentReference || input.intent.pesapal_order_tracking_id || input.intent.pesapal_merchant_reference || null,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Could not create paid storefront order after M-Pesa payment.");

  const orderItems = payload.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) throw new Error("Could not create order items after M-Pesa payment.");

  await reduceStockAfterPaidOrder(tenant.id, payload.items);

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const message = buildWhatsAppOrderMessage({
    tenantName: branding.displayName,
    order,
    ...branding,
    items: payload.items.map((item) => ({ product_name: item.product_name, quantity: item.quantity, line_total: item.line_total })),
    payment: {
      label: payload.paymentMethodLabel || "Paid online",
      status: "paid",
      reference: input.paymentReference || input.intent.pesapal_order_tracking_id || input.intent.pesapal_merchant_reference || null,
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
      body: `${payload.customerName} paid by M-Pesa for a ${payload.orderType} order.`,
      payload: { orderId: order.id, route: "/admin/orders" },
    }),
    enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId: order.id,
      audience: "customer",
      eventType: "order_received",
      title: "Payment received",
      body: "Your M-Pesa payment has been received and the order has been sent to the store.",
      payload: { orderId: order.id, status: "new" },
    }),
    sendAdminPushForTenant(tenant.id, {
      title: "Paid order received",
      body: `${payload.customerName} paid by M-Pesa for a ${payload.orderType} order.`,
      url: "/admin/orders",
      tag: `orduva-order-${order.id}`,
    }),
  ]);

  await db
    .from("storefront_payment_intents")
    .update({ status: "paid", order_id: order.id, updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", tenant.id);

  return order.id as string;
}

export async function reconcilePesapalIntent(input: { checkoutId?: string | null; orderTrackingId?: string | null; merchantReference?: string | null }) {
  const intent = await loadPesapalIntentByCheckout(input);
  if (!intent) return null;
  if (intent.order_id) return { intent, status: "paid", orderId: intent.order_id as string, paymentId: getString(intent.pesapal_order_tracking_id) || null };

  const pesapalStatus = await fetchPesapalTransactionStatus({ intent });
  const statusValue = pesapalStatus.statusCode ?? pesapalStatus.status;

  if (isCompletedStatus(statusValue)) {
    const orderId = await createPaidOrderFromPesapalIntent({
      intent,
      paymentId: getString(intent.pesapal_order_tracking_id),
      paymentReference: pesapalStatus.confirmationCode || getString(intent.pesapal_order_tracking_id) || getString(intent.pesapal_merchant_reference),
      paymentMethod: pesapalStatus.paymentMethod,
      paidAt: new Date().toISOString(),
    });
    return { intent: { ...intent, order_id: orderId }, status: "paid", orderId, paymentId: getString(intent.pesapal_order_tracking_id), paymentMethod: pesapalStatus.paymentMethod };
  }

  if (isFailedStatus(statusValue)) {
    const nextStatus = String(statusValue).toLowerCase() === "3" || String(statusValue).toLowerCase() === "reversed" ? "refunded" : "failed";
    await db.from("storefront_payment_intents").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", intent.id).eq("tenant_id", intent.tenant_id).is("order_id", null);
  }

  return { intent, status: pesapalStatus.status || intent.status || "checkout_started", orderId: null as string | null, paymentId: getString(intent.pesapal_order_tracking_id) || null, paymentMethod: pesapalStatus.paymentMethod };
}
