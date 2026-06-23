import crypto from "crypto";
import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant, sendCustomerPushForOrderWithFallback } from "@/lib/web-push";

export type TenantOzowCustomerSettings = {
  tenant_id: string;
  enable_ozow_customer_payments: boolean | null;
  ozow_connection_status: string | null;
  ozow_customer_mode: string | null;
  ozow_site_code: string | null;
  ozow_private_key: string | null;
  ozow_api_key?: string | null;
  ozow_account_label: string | null;
  ozow_setup_notes: string | null;
  ozow_payments_live: boolean | null;
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
  paymentProvider: "ozow";
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

export type OzowResponsePayload = {
  SiteCode: string;
  TransactionId: string;
  TransactionReference: string;
  Amount: string;
  Status: string;
  Optional1: string;
  Optional2: string;
  Optional3: string;
  Optional4: string;
  Optional5: string;
  CurrencyCode: string;
  IsTest: string;
  StatusMessage: string;
  Hash: string;
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

function sha512Lower(value: string) {
  return crypto.createHash("sha512").update(value.toLowerCase()).digest("hex");
}

function appendSecretAndHash(values: Array<string | number | boolean | null | undefined>, secret: string) {
  return sha512Lower(values.map((value) => String(value ?? "")).join("") + secret);
}

function ozowIsTest(mode: string | null | undefined) {
  return String(mode || "test").toLowerCase() !== "live";
}

export function ozowPayUrl() {
  return "https://pay.ozow.com";
}

export async function loadTenantOzowCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_ozow_customer_payments, ozow_connection_status, ozow_customer_mode, ozow_site_code, ozow_private_key, ozow_api_key, ozow_account_label, ozow_setup_notes, ozow_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load tenant Ozow settings.");
  return (data || null) as TenantOzowCustomerSettings | null;
}

export function assertTenantOzowReady(settings: TenantOzowCustomerSettings | null, currencyCode: string) {
  if (String(currencyCode || "").toUpperCase() !== "ZAR") throw new Error("Ozow checkout is currently only available for ZAR stores.");
  if (!settings) throw new Error("Ozow is not configured for this store.");
  if (settings.enable_ozow_customer_payments !== true) throw new Error("Ozow customer payments are not enabled for this store.");
  if (!configured(settings.ozow_connection_status)) throw new Error("Ozow is not marked as connected for this store.");
  if (settings.ozow_payments_live !== true) throw new Error("Ozow customer payments are not live for this store yet.");
  if (!getString(settings.ozow_site_code)) throw new Error("Store Ozow site code is missing.");
  if (!getString(settings.ozow_private_key)) throw new Error("Store Ozow private key is missing.");
}

export async function createTenantOzowOrderCheckoutIntent(input: {
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
  const ozowSettings = await loadTenantOzowCustomerSettings(input.tenantId);
  assertTenantOzowReady(ozowSettings, currencyCode);
  const readyOzowSettings = ozowSettings as TenantOzowCustomerSettings;

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
    paymentProvider: "ozow",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    discounts: input.discounts || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "ozow",
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

  if (intentError || !intent?.id) throw new Error("Could not prepare Ozow checkout.");

  const checkoutId = String(intent.id);
  const amount = money(input.total);
  const origin = storefrontReturnOrigin(input.req, input.tenantSlug);
  const successUrl = `${origin}/api/storefront/ozow/return?result=success&checkout_id=${encodeURIComponent(checkoutId)}`;
  const cancelUrl = `${origin}/api/storefront/ozow/return?result=cancel&checkout_id=${encodeURIComponent(checkoutId)}`;
  const errorUrl = `${origin}/api/storefront/ozow/return?result=error&checkout_id=${encodeURIComponent(checkoutId)}`;
  const notifyUrl = `${origin}/api/storefront/ozow/webhook`;
  const transactionReference = checkoutId;
  const bankReference = `ORD${checkoutId.replace(/-/g, "").slice(0, 17)}`.slice(0, 20);

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      ozow_transaction_reference: transactionReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return {
    checkoutId,
    transactionReference,
    bankReference,
    url: `/api/storefront/ozow/redirect?checkout_id=${encodeURIComponent(checkoutId)}`,
    fields: buildOzowPostFields({
      settings: readyOzowSettings,
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

export function buildOzowPostFields(input: {
  settings: TenantOzowCustomerSettings;
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
  const siteCode = getString(input.settings.ozow_site_code);
  const privateKey = getString(input.settings.ozow_private_key);
  const isTest = ozowIsTest(input.settings.ozow_customer_mode) ? "true" : "false";
  const fields: Record<string, string> = {
    SiteCode: siteCode,
    CountryCode: "ZA",
    CurrencyCode: "ZAR",
    Amount: input.amount,
    TransactionReference: input.transactionReference,
    BankReference: input.bankReference,
    Optional1: input.checkoutId,
    Optional2: input.tenantSlug.slice(0, 50),
    Optional3: "orduva_storefront",
    Optional4: "",
    Optional5: "",
    Customer: input.customer.slice(0, 100),
    CancelUrl: input.cancelUrl,
    ErrorUrl: input.errorUrl,
    SuccessUrl: input.successUrl,
    NotifyUrl: input.notifyUrl,
    IsTest: isTest,
  };
  fields.HashCheck = appendSecretAndHash(
    [
      fields.SiteCode,
      fields.CountryCode,
      fields.CurrencyCode,
      fields.Amount,
      fields.TransactionReference,
      fields.BankReference,
      fields.Optional1,
      fields.Optional2,
      fields.Optional3,
      fields.Optional4,
      fields.Optional5,
      fields.Customer,
      fields.CancelUrl,
      fields.ErrorUrl,
      fields.SuccessUrl,
      fields.NotifyUrl,
      fields.IsTest,
    ],
    privateKey,
  );
  return fields;
}

export function buildOzowAutoSubmitHtml(fields: Record<string, string>) {
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Redirecting to Ozow</title></head><body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;display:grid;min-height:100vh;place-items:center;margin:0;"><main style="max-width:520px;background:white;border:1px solid #e2e8f0;border-radius:28px;padding:28px;text-align:center;box-shadow:0 18px 60px rgba(15,23,42,.12);"><h1 style="margin:0 0 10px;font-size:24px;">Redirecting to Ozow</h1><p style="margin:0 0 18px;color:#475569;line-height:1.5;">Please wait while we send you to the secure Ozow payment page.</p><form id="ozow-payment-form" method="post" action="${ozowPayUrl()}">${inputs}<button style="min-height:44px;border:0;border-radius:16px;background:#0f172a;color:white;font-weight:800;padding:12px 18px;" type="submit">Continue to Ozow</button></form><script>document.getElementById('ozow-payment-form').submit();</script></main></body></html>`;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loadOzowIntentByReference(input: { checkoutId?: string | null; transactionReference?: string | null; transactionId?: string | null }) {
  let query = db.from("storefront_payment_intents").select("*").eq("provider", "ozow");
  const checkoutId = getString(input.checkoutId);
  const transactionReference = getString(input.transactionReference);
  const transactionId = getString(input.transactionId);
  if (checkoutId) query = query.eq("id", checkoutId);
  else if (transactionReference) query = query.eq("ozow_transaction_reference", transactionReference);
  else if (transactionId) query = query.eq("ozow_transaction_id", transactionId);
  else return null;
  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Could not load Ozow checkout intent.");
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
      if (stockError) console.error("Failed to reduce variant stock after Ozow payment", stockError);
      continue;
    }

    if (!product.stock_enabled) continue;
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - quantity);
    const { error: stockError } = await db.from("products").update({ stock_quantity: nextStock }).eq("id", product.id).eq("tenant_id", tenantId);
    if (stockError) console.error("Failed to reduce product stock after Ozow payment", stockError);
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

export async function createPaidOrderFromOzowIntent(input: { intent: Record<string, any>; paymentReference?: string | null; transactionId?: string | null; paidAt?: string | null }) {
  if (!input.intent?.id) throw new Error("Missing Ozow checkout intent.");
  if (input.intent.order_id) return input.intent.order_id as string;

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started"])
    .select("id,status,order_id,tenant_id,ozow_transaction_reference,ozow_transaction_id,order_payload,amount_total,currency_code")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim Ozow checkout intent.");
  if (!claimedIntent) {
    const latest = await loadOzowIntentByReference({ checkoutId: input.intent.id });
    if (latest?.order_id) return latest.order_id as string;
    return input.intent.order_id as string;
  }

  input.intent = claimedIntent;
  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length) throw new Error("Ozow checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db.from("tenants").select("id, slug, name, whatsapp_number").eq("id", input.intent.tenant_id).maybeSingle();
  if (tenantError || !tenant) throw new Error("Store not found for Ozow checkout intent.");

  const checkoutReference = input.intent.ozow_transaction_reference || input.intent.id || null;
  const transactionId = input.transactionId || input.intent.ozow_transaction_id || null;
  const paymentReference = input.paymentReference || input.transactionId || input.intent.ozow_transaction_reference || null;
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
      payment_provider: "ozow",
      payment_method_label: payload.paymentMethodLabel || "Ozow payment",
      payment_status: "paid",
      payment_checkout_session_id: checkoutReference,
      payment_intent_id: transactionId,
      payment_reference: paymentReference,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Could not create paid storefront order after Ozow payment.");

  const orderItems = payload.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) throw new Error("Could not create order items after Ozow payment.");

  await reduceStockAfterPaidOrder(tenant.id, payload.items);

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const message = buildWhatsAppOrderMessage({
    tenantName: branding.displayName,
    order,
    ...branding,
    items: payload.items.map((item) => ({ product_name: item.product_name, quantity: item.quantity, line_total: item.line_total })),
    payment: { label: payload.paymentMethodLabel || "Paid by Ozow", status: "paid", reference: paymentReference || transactionId || checkoutReference || null },
  });

  await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

  await Promise.allSettled([
    enqueueNotificationEvent({ tenantId: tenant.id, orderId: order.id, audience: "admin", eventType: "new_order", title: "Paid order received", body: `${payload.customerName} paid by Ozow for a ${payload.orderType} order.`, payload: { orderId: order.id, route: "/admin/orders" } }),
    enqueueNotificationEvent({ tenantId: tenant.id, orderId: order.id, audience: "customer", eventType: "order_received", title: "Payment received", body: "Your Ozow payment has been received and the order has been sent to the store.", payload: { orderId: order.id, status: "new" } }),
    sendCustomerPushForOrderWithFallback(tenant.id, order.id, { title: "Payment received", body: "Your Ozow payment has been received and the order has been sent to the store.", url: "/account", tag: `orduva-customer-${order.id}-paid` }),
    sendAdminPushForTenant(tenant.id, { title: "Paid order received", body: `${payload.customerName} paid by Ozow for a ${payload.orderType} order.`, url: "/admin/orders", tag: `orduva-order-${order.id}` }),
  ]);

  await db
    .from("storefront_payment_intents")
    .update({ status: "paid", order_id: order.id, ozow_transaction_id: transactionId, updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", tenant.id);

  return order.id as string;
}

export function normalizeOzowResponse(input: Record<string, unknown>): OzowResponsePayload {
  return {
    SiteCode: getString(input.SiteCode ?? input.siteCode ?? input.sitecode),
    TransactionId: getString(input.TransactionId ?? input.transactionId ?? input.transactionid),
    TransactionReference: getString(input.TransactionReference ?? input.transactionReference ?? input.transactionreference),
    Amount: getString(input.Amount ?? input.amount),
    Status: getString(input.Status ?? input.status),
    Optional1: getString(input.Optional1 ?? input.optional1),
    Optional2: getString(input.Optional2 ?? input.optional2),
    Optional3: getString(input.Optional3 ?? input.optional3),
    Optional4: getString(input.Optional4 ?? input.optional4),
    Optional5: getString(input.Optional5 ?? input.optional5),
    CurrencyCode: getString(input.CurrencyCode ?? input.currencyCode ?? input.currencycode),
    IsTest: getString(input.IsTest ?? input.isTest ?? input.istest),
    StatusMessage: getString(input.StatusMessage ?? input.statusMessage ?? input.statusmessage),
    Hash: getString(input.Hash ?? input.hash),
  };
}

export async function verifyOzowResponse(payload: OzowResponsePayload) {
  const intent = await loadOzowIntentByReference({ checkoutId: payload.Optional1, transactionReference: payload.TransactionReference, transactionId: payload.TransactionId });
  if (!intent) throw new Error("Ozow checkout intent was not found.");
  const settings = await loadTenantOzowCustomerSettings(String(intent.tenant_id));
  const privateKey = getString(settings?.ozow_private_key);
  if (!privateKey) throw new Error("Ozow private key is missing for this store.");
  if (!payload.Hash) throw new Error("Ozow response hash is missing.");
  const expected = appendSecretAndHash(
    [payload.SiteCode, payload.TransactionId, payload.TransactionReference, payload.Amount, payload.Status, payload.Optional1, payload.Optional2, payload.Optional3, payload.Optional4, payload.Optional5, payload.CurrencyCode, payload.IsTest, payload.StatusMessage],
    privateKey,
  );
  if (expected.toLowerCase() !== payload.Hash.toLowerCase()) throw new Error("Ozow response hash validation failed.");
  return { intent, settings };
}

export async function processOzowResponse(payload: OzowResponsePayload) {
  const { intent } = await verifyOzowResponse(payload);
  const status = payload.Status.trim().toLowerCase();
  const transactionId = payload.TransactionId || null;

  if (status === "complete") {
    const orderId = await createPaidOrderFromOzowIntent({ intent, transactionId, paymentReference: payload.TransactionReference || transactionId, paidAt: new Date().toISOString() });
    return { status: "paid", orderId, intent };
  }

  if (status === "cancelled" || status === "canceled") {
    await db.from("storefront_payment_intents").update({ status: "cancelled", ozow_transaction_id: transactionId, updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "ozow").is("order_id", null);
    return { status: "cancelled", orderId: intent.order_id || null, intent };
  }

  if (status === "error") {
    await db.from("storefront_payment_intents").update({ status: "failed", ozow_transaction_id: transactionId, updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "ozow").is("order_id", null);
    return { status: "failed", orderId: intent.order_id || null, intent };
  }

  return { status: intent.status || "checkout_started", orderId: intent.order_id || null, intent };
}

export async function reconcileOzowIntent(input: { checkoutId?: string | null; transactionReference?: string | null; transactionId?: string | null }) {
  const intent = await loadOzowIntentByReference(input);
  if (!intent) return null;
  return {
    status: intent.status || "created",
    orderId: intent.order_id || null,
    transactionReference: intent.ozow_transaction_reference || null,
    transactionId: intent.ozow_transaction_id || null,
    intent,
  };
}
