import crypto from "crypto";
import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant, sendCustomerPushForOrderWithFallback } from "@/lib/web-push";

export type TenantPayFastCustomerSettings = {
  tenant_id: string;
  enable_payfast_customer_payments: boolean | null;
  payfast_connection_status: string | null;
  payfast_customer_mode: string | null;
  payfast_merchant_id: string | null;
  payfast_merchant_key: string | null;
  payfast_passphrase?: string | null;
  payfast_account_label: string | null;
  payfast_setup_notes: string | null;
  payfast_payments_live: boolean | null;
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
  paymentProvider: "payfast";
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
    is_preorder?: boolean | null;
  }>;
};

export type PayFastResponsePayload = {
  merchant_id: string;
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  amount_gross: string;
  custom_str1: string;
  custom_str2: string;
  custom_str3: string;
  custom_str4: string;
  custom_str5: string;
  signature: string;
  Raw: Record<string, string>;
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

function money(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100) / 100).toFixed(2);
}

function md5Lower(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

function payfastEncode(value: string) {
  return encodeURIComponent(String(value || "").trim()).replace(/%20/g, "+");
}

function buildPayFastSignature(fields: Record<string, string>, passphrase?: string | null) {
  const pairs = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && !key.startsWith("__") && String(value ?? "").trim() !== "")
    .map(([key, value]) => `${key}=${payfastEncode(value)}`);
  const cleanPassphrase = getString(passphrase);
  if (cleanPassphrase) pairs.push(`passphrase=${payfastEncode(cleanPassphrase)}`);
  return md5Lower(pairs.join("&"));
}

function payfastIsTest(mode: string | null | undefined) {
  return String(mode || "test").toLowerCase() !== "live";
}

export function payfastPayUrl(mode?: string | null) {
  return payfastIsTest(mode) ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
}

export async function loadTenantPayFastCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_payfast_customer_payments, payfast_connection_status, payfast_customer_mode, payfast_merchant_id, payfast_merchant_key, payfast_passphrase, payfast_account_label, payfast_setup_notes, payfast_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load tenant PayFast settings.");
  return (data || null) as TenantPayFastCustomerSettings | null;
}

export function assertTenantPayFastReady(settings: TenantPayFastCustomerSettings | null, currencyCode: string) {
  if (String(currencyCode || "").toUpperCase() !== "ZAR") throw new Error("PayFast checkout is currently only available for ZAR stores.");
  if (!settings) throw new Error("PayFast is not configured for this store.");
  if (settings.enable_payfast_customer_payments !== true) throw new Error("PayFast customer payments are not enabled for this store.");
  if (!configured(settings.payfast_connection_status)) throw new Error("PayFast is not marked as connected for this store.");
  if (settings.payfast_payments_live !== true) throw new Error("PayFast customer payments are not live for this store yet.");
  if (!getString(settings.payfast_merchant_id)) throw new Error("Store PayFast merchant ID is missing.");
  if (!getString(settings.payfast_merchant_key)) throw new Error("Store PayFast merchant key is missing.");
}

export async function createTenantPayFastOrderCheckoutIntent(input: {
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
  const currencyCode = String(input.currencyCode || "ZAR").toUpperCase();
  const payfastSettings = await loadTenantPayFastCustomerSettings(input.tenantId);
  assertTenantPayFastReady(payfastSettings, currencyCode);
  const readyPayFastSettings = payfastSettings as TenantPayFastCustomerSettings;

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
    currencyCode,
    paymentProvider: "payfast",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    discounts: input.discounts || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "payfast",
      status: "created",
      amount_total: input.total,
      currency_code: currencyCode,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      order_payload: payload,
      preorder_payment_stage: input.preorder ? "deposit" : "full_payment",
    })
    .select("id")
    .single();

  if (intentError || !intent?.id) throw new Error("Could not prepare PayFast checkout.");

  const checkoutId = String(intent.id);
  const amount = money(input.total);
  const origin = storefrontReturnOrigin(input.req, input.tenantSlug);
  const successUrl = `${origin}/api/storefront/payfast/return?result=success&checkout_id=${encodeURIComponent(checkoutId)}`;
  const cancelUrl = `${origin}/api/storefront/payfast/return?result=cancel&checkout_id=${encodeURIComponent(checkoutId)}`;
  const errorUrl = `${origin}/api/storefront/payfast/return?result=error&checkout_id=${encodeURIComponent(checkoutId)}`;
  const notifyUrl = `${origin}/api/storefront/payfast/webhook`;
  const transactionReference = checkoutId;
  const bankReference = `ORD${checkoutId.replace(/-/g, "").slice(0, 17)}`.slice(0, 20);

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      payfast_transaction_reference: transactionReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return {
    checkoutId,
    transactionReference,
    bankReference,
    url: `/api/storefront/payfast/redirect?checkout_id=${encodeURIComponent(checkoutId)}`,
    fields: buildPayFastPostFields({
      settings: readyPayFastSettings,
      amount,
      transactionReference,
      bankReference,
      customer: input.customerName,
      successUrl,
      cancelUrl,
      errorUrl,
      notifyUrl,
      tenantSlug: input.tenantSlug,
      checkoutId,
    }),
  };
}

export function buildPayFastPostFields(input: {
  settings: TenantPayFastCustomerSettings;
  amount: string;
  transactionReference: string;
  bankReference: string;
  customer: string;
  successUrl: string;
  cancelUrl: string;
  errorUrl: string;
  notifyUrl: string;
  tenantSlug: string;
  checkoutId: string;
}) {
  const nameParts = String(input.customer || "Customer").trim().split(/\s+/).filter(Boolean);
  const firstName = (nameParts.shift() || "Customer").slice(0, 100);
  const lastName = nameParts.join(" ").slice(0, 100);
  const fields: Record<string, string> = {
    merchant_id: getString(input.settings.payfast_merchant_id),
    merchant_key: getString(input.settings.payfast_merchant_key),
    return_url: input.successUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    name_first: firstName,
    name_last: lastName,
    m_payment_id: input.transactionReference,
    amount: input.amount,
    item_name: `${input.tenantSlug} order`.slice(0, 100),
    item_description: `Orduva storefront order ${input.bankReference}`.slice(0, 255),
    custom_str1: input.checkoutId,
    custom_str2: input.tenantSlug.slice(0, 50),
    custom_str3: "orduva_storefront",
    custom_str4: input.bankReference,
    custom_str5: "",
    __payfast_action: payfastPayUrl(input.settings.payfast_customer_mode),
  };
  fields.signature = buildPayFastSignature(fields, input.settings.payfast_passphrase);
  return fields;
}

export function buildPayFastAutoSubmitHtml(fields: Record<string, string>) {
  const action = fields.__payfast_action || payfastPayUrl("live");
  const inputs = Object.entries(fields)
    .filter(([name]) => !name.startsWith("__"))
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Redirecting to PayFast</title></head><body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;display:grid;min-height:100vh;place-items:center;margin:0;"><main style="max-width:520px;background:white;border:1px solid #e2e8f0;border-radius:28px;padding:28px;text-align:center;box-shadow:0 18px 60px rgba(15,23,42,.12);"><h1 style="margin:0 0 10px;font-size:24px;">Redirecting to PayFast</h1><p style="margin:0 0 18px;color:#475569;line-height:1.5;">Please wait while we send you to the secure PayFast payment page.</p><form id="payfast-payment-form" method="post" action="${escapeHtml(action)}">${inputs}<button style="min-height:44px;border:0;border-radius:16px;background:#0f172a;color:white;font-weight:800;padding:12px 18px;" type="submit">Continue to PayFast</button></form><script>document.getElementById('payfast-payment-form').submit();</script></main></body></html>`;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loadPayFastIntentByReference(input: { checkoutId?: string | null; transactionReference?: string | null; transactionId?: string | null }) {
  let query = db.from("storefront_payment_intents").select("*").eq("provider", "payfast");
  const checkoutId = getString(input.checkoutId);
  const transactionReference = getString(input.transactionReference);
  const transactionId = getString(input.transactionId);
  if (checkoutId) query = query.eq("id", checkoutId);
  else if (transactionReference) query = query.eq("payfast_transaction_reference", transactionReference);
  else if (transactionId) query = query.eq("payfast_transaction_id", transactionId);
  else return null;
  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Could not load PayFast checkout intent.");
  return data as Record<string, any> | null;
}

function reduceVariantStock(variants: any[], variantId: string, quantity: number) {
  return variants.map((variant) => {
    if (variant?.id !== variantId) return variant;
    const current = Number(variant.stockQuantity ?? variant.stock_quantity ?? 0);
    return { ...variant, stockQuantity: Math.max(0, current - quantity) };
  });
}

async function reduceStockAfterPaidOrder(tenantId: string, items: PendingOrderPayload["items"]) {
  const quantityBySellableLine = new Map<string, number>();
  for (const item of items) {
    if ((item as any).is_preorder === true) continue;
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
      const { error: stockError } = await db.from("products").update({ product_variants: nextVariants }).eq("id", product.id).eq("tenant_id", tenantId);
      if (stockError) console.error("Failed to reduce variant stock after PayFast payment", stockError);
      continue;
    }

    if (!product.stock_enabled) continue;
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - quantity);
    const { error: stockError } = await db.from("products").update({ stock_quantity: nextStock }).eq("id", product.id).eq("tenant_id", tenantId);
    if (stockError) console.error("Failed to reduce product stock after PayFast payment", stockError);
  }
}

async function findExistingPaidOrderByPaymentRefs(tenantId: string, refs: Array<string | null | undefined>) {
  const cleanRefs = Array.from(new Set(refs.map((ref) => String(ref || "").trim()).filter(Boolean)));
  for (const ref of cleanRefs) {
    const { data, error } = await db
      .from("orders")
      .select("id")
      .eq("tenant_id", tenantId)
      .or(`payment_checkout_session_id.eq.${ref},payment_intent_id.eq.${ref},payment_reference.eq.${ref}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data?.id) return String(data.id);
  }
  return null;
}

export async function createPaidOrderFromPayFastIntent(input: { intent: Record<string, any>; paymentReference?: string | null; transactionId?: string | null; paidAt?: string | null }) {
  if (!input.intent?.id) throw new Error("Missing PayFast checkout intent.");
  if (input.intent.order_id) return input.intent.order_id as string;

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started"])
    .select("id,status,order_id,tenant_id,payfast_transaction_reference,payfast_transaction_id,order_payload,amount_total,currency_code")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim PayFast checkout intent.");
  if (!claimedIntent) {
    const latest = await loadPayFastIntentByReference({ checkoutId: input.intent.id });
    if (latest?.order_id) return latest.order_id as string;
    return input.intent.order_id as string;
  }

  input.intent = claimedIntent;
  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length) throw new Error("PayFast checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db.from("tenants").select("id, slug, name, whatsapp_number").eq("id", input.intent.tenant_id).maybeSingle();
  if (tenantError || !tenant) throw new Error("Store not found for PayFast checkout intent.");

  const checkoutReference = input.intent.payfast_transaction_reference || input.intent.id || null;
  const transactionId = input.transactionId || input.intent.payfast_transaction_id || null;
  const paymentReference = input.paymentReference || input.transactionId || input.intent.payfast_transaction_reference || null;
  const existingPaidOrderId = await findExistingPaidOrderByPaymentRefs(tenant.id, [checkoutReference, transactionId, paymentReference]);
  if (existingPaidOrderId) {
    await db.from("storefront_payment_intents").update({ order_id: existingPaidOrderId, status: "paid", updated_at: new Date().toISOString() }).eq("id", input.intent.id).eq("tenant_id", tenant.id);
    return existingPaidOrderId;
  }

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
      discount_allow_with_rewards: payload.discounts?.discount_allow_with_rewards ?? true,
      discount_only_this_discount: payload.discounts?.discount_only_this_discount ?? false,
      rewards_spend_before: payload.rewards?.rewards_spend_before ?? null,
      rewards_spend_after: payload.rewards?.rewards_spend_after ?? null,
      notes: payload.notes || null,
      payment_provider: "payfast",
      payment_method_label: payload.paymentMethodLabel || "PayFast payment",
      payment_status: "paid",
      payment_checkout_session_id: checkoutReference,
      payment_intent_id: transactionId,
      payment_reference: paymentReference,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Could not create paid storefront order after PayFast payment.");

  const orderItems = payload.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) throw new Error("Could not create order items after PayFast payment.");

  await reduceStockAfterPaidOrder(tenant.id, payload.items);

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const message = buildWhatsAppOrderMessage({
    tenantName: branding.displayName,
    order,
    ...branding,
    items: payload.items.map((item) => ({ product_name: item.product_name, quantity: item.quantity, line_total: item.line_total })),
    payment: { label: payload.paymentMethodLabel || "Paid by PayFast", status: "paid", reference: paymentReference || transactionId || checkoutReference || null },
  });

  await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

  await Promise.allSettled([
    enqueueNotificationEvent({ tenantId: tenant.id, orderId: order.id, audience: "admin", eventType: "new_order", title: "Paid order received", body: `${payload.customerName} paid by PayFast for a ${payload.orderType} order.`, payload: { orderId: order.id, route: "/admin/orders" } }),
    enqueueNotificationEvent({ tenantId: tenant.id, orderId: order.id, audience: "customer", eventType: "order_received", title: "Payment received", body: "Your PayFast payment has been received and the order has been sent to the store.", payload: { orderId: order.id, status: "new" } }),
    sendCustomerPushForOrderWithFallback(tenant.id, order.id, { title: "Payment received", body: "Your PayFast payment has been received and the order has been sent to the store.", url: "/account", tag: `orduva-customer-${order.id}-paid` }),
    sendAdminPushForTenant(tenant.id, { title: "Paid order received", body: `${payload.customerName} paid by PayFast for a ${payload.orderType} order.`, url: "/admin/orders", tag: `orduva-order-${order.id}` }),
  ]);

  await db
    .from("storefront_payment_intents")
    .update({ status: "paid", order_id: order.id, payfast_transaction_id: transactionId, updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", tenant.id);

  return order.id as string;
}

export function normalizePayFastResponse(input: Record<string, unknown>): PayFastResponsePayload {
  const raw = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, getString(value)]));
  return {
    merchant_id: getString(input.merchant_id ?? input.MerchantId ?? input.merchantId),
    m_payment_id: getString(input.m_payment_id ?? input.payment_id ?? input.TransactionReference),
    pf_payment_id: getString(input.pf_payment_id ?? input.TransactionId ?? input.transactionId),
    payment_status: getString(input.payment_status ?? input.Status ?? input.status),
    amount_gross: getString(input.amount_gross ?? input.Amount ?? input.amount),
    custom_str1: getString(input.custom_str1 ?? input.Optional1 ?? input.checkout_id),
    custom_str2: getString(input.custom_str2 ?? input.Optional2),
    custom_str3: getString(input.custom_str3 ?? input.Optional3),
    custom_str4: getString(input.custom_str4 ?? input.Optional4),
    custom_str5: getString(input.custom_str5 ?? input.Optional5),
    signature: getString(input.signature ?? input.Hash ?? input.hash),
    Raw: raw,
  };
}

export async function verifyPayFastResponse(payload: PayFastResponsePayload) {
  const intent = await loadPayFastIntentByReference({ checkoutId: payload.custom_str1, transactionReference: payload.m_payment_id, transactionId: payload.pf_payment_id });
  if (!intent) throw new Error("PayFast checkout intent was not found.");
  const settings = await loadTenantPayFastCustomerSettings(String(intent.tenant_id));
  if (!settings?.payfast_merchant_id || !settings?.payfast_merchant_key) throw new Error("PayFast merchant credentials are missing for this store.");
  if (!payload.signature) throw new Error("PayFast response signature is missing.");
  const expected = buildPayFastSignature(payload.Raw || {}, settings.payfast_passphrase);
  if (expected.toLowerCase() !== payload.signature.toLowerCase()) throw new Error("PayFast response signature validation failed.");
  const expectedAmount = money(Number(intent.amount_total || 0));
  const paidAmount = money(Number(payload.amount_gross || 0));
  if (expectedAmount !== paidAmount) throw new Error("PayFast amount validation failed.");
  return { intent, settings };
}

export async function processPayFastResponse(payload: PayFastResponsePayload) {
  const { intent } = await verifyPayFastResponse(payload);
  const status = payload.payment_status.trim().toLowerCase();
  const transactionId = payload.pf_payment_id || null;

  if (status === "complete" || status === "completed") {
    const orderId = await createPaidOrderFromPayFastIntent({ intent, transactionId, paymentReference: payload.m_payment_id || transactionId, paidAt: new Date().toISOString() });
    return { status: "paid", orderId, intent };
  }

  if (status === "cancelled" || status === "canceled") {
    await db.from("storefront_payment_intents").update({ status: "cancelled", payfast_transaction_id: transactionId, updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "payfast").is("order_id", null);
    return { status: "cancelled", orderId: intent.order_id || null, intent };
  }

  if (status === "failed" || status === "error") {
    await db.from("storefront_payment_intents").update({ status: "failed", payfast_transaction_id: transactionId, updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "payfast").is("order_id", null);
    return { status: "failed", orderId: intent.order_id || null, intent };
  }

  return { status: intent.status || "checkout_started", orderId: intent.order_id || null, intent };
}

export async function reconcilePayFastIntent(input: { checkoutId?: string | null; transactionReference?: string | null; transactionId?: string | null }) {
  const intent = await loadPayFastIntentByReference(input);
  if (!intent) return null;
  return {
    status: intent.status || "created",
    orderId: intent.order_id || null,
    transactionReference: intent.payfast_transaction_reference || null,
    transactionId: intent.payfast_transaction_id || null,
    intent,
  };
}
