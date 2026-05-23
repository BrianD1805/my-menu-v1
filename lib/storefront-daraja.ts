import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant } from "@/lib/web-push";

export type TenantDarajaCustomerSettings = {
  tenant_id: string;
  enable_daraja_customer_payments: boolean | null;
  daraja_connection_status: string | null;
  daraja_customer_mode: string | null;
  daraja_consumer_key: string | null;
  daraja_consumer_secret: string | null;
  daraja_shortcode: string | null;
  daraja_passkey: string | null;
  daraja_transaction_type: string | null;
  daraja_account_reference_prefix: string | null;
  daraja_callback_url: string | null;
  daraja_account_label: string | null;
  daraja_setup_notes: string | null;
  daraja_payments_live: boolean | null;
};

type RewardOrderMetadata = {
  reward_tier: string | null;
  reward_discount_percent: number;
  reward_discount_amount: number;
  subtotal_total: number;
  rewards_spend_before: number | null;
  rewards_spend_after: number | null;
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
  paymentProvider: "daraja";
  paymentMethodLabel: string;
  rewards?: RewardOrderMetadata | null;
  items: Array<{
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
};

type DarajaTokenResponse = {
  access_token?: string;
  expires_in?: string;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  message?: string;
};

type DarajaStkPushResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
};

export function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function configured(status: string | null | undefined) {
  return status === "configured" || status === "connected" || status === "active";
}

function darajaApiBase(mode: string | null | undefined) {
  return String(mode || "sandbox").trim().toLowerCase() === "live" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
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

function normalizeKenyanPhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^2547\d{8}$/.test(digits)) return digits;
  if (/^2541\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^01\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `254${digits}`;
  if (/^1\d{8}$/.test(digits)) return `254${digits}`;
  throw new Error("Enter a valid Kenyan Safaricom phone number for M-Pesa, for example 07XXXXXXXX or 2547XXXXXXXX.");
}

function darajaTimestamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function base64Encode(value: string) {
  return Buffer.from(value).toString("base64");
}

function safeAccountReference(prefix: string | null | undefined, checkoutId: string) {
  const cleanPrefix = getString(prefix).replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 18) || "ORDUVA";
  const cleanId = checkoutId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  return `${cleanPrefix}-${cleanId}`.slice(0, 12);
}

export async function loadTenantDarajaCustomerSettings(tenantId: string) {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, enable_daraja_customer_payments, daraja_connection_status, daraja_customer_mode, daraja_consumer_key, daraja_consumer_secret, daraja_shortcode, daraja_passkey, daraja_transaction_type, daraja_account_reference_prefix, daraja_callback_url, daraja_account_label, daraja_setup_notes, daraja_payments_live")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Could not load direct M-Pesa Daraja settings.");
  return (data || null) as TenantDarajaCustomerSettings | null;
}

export function assertTenantDarajaReady(settings: TenantDarajaCustomerSettings | null, currencyCode: string) {
  if (String(currencyCode || "").toUpperCase() !== "KES") throw new Error("Direct M-Pesa checkout is currently only available for KES stores.");
  if (!settings) throw new Error("Direct M-Pesa Daraja is not configured for this store.");
  if (settings.enable_daraja_customer_payments !== true) throw new Error("Direct M-Pesa Daraja is not enabled for this store.");
  if (settings.daraja_payments_live !== true) throw new Error("Direct M-Pesa is not yet switched on for customer checkout.");
  if (!configured(settings.daraja_connection_status)) throw new Error("Direct M-Pesa Daraja is not marked as connected for this store.");
  if (!getString(settings.daraja_consumer_key)) throw new Error("Daraja consumer key is missing.");
  if (!getString(settings.daraja_consumer_secret)) throw new Error("Daraja consumer secret is missing.");
  const shortcode = getString(settings.daraja_shortcode);
  if (!shortcode) throw new Error("Daraja shortcode / till / paybill is missing.");
  if (!getString(settings.daraja_passkey)) throw new Error("Daraja passkey is missing.");
  if (String(settings.daraja_customer_mode || "").toLowerCase() === "live" && shortcode === "174379") {
    throw new Error("Live Direct M-Pesa cannot use the Safaricom sandbox shortcode 174379. Add the tenant's live PayBill or Till number before enabling checkout.");
  }
}

async function requestDarajaToken(settings: TenantDarajaCustomerSettings) {
  const credentials = base64Encode(`${getString(settings.daraja_consumer_key)}:${getString(settings.daraja_consumer_secret)}`);
  const response = await fetch(`${darajaApiBase(settings.daraja_customer_mode)}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${credentials}`, Accept: "application/json" },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as DarajaTokenResponse | null;
  const token = getString(data?.access_token);
  if (!response.ok || !token) throw new Error(data?.errorMessage || data?.message || `Daraja token request failed with status ${response.status}`);
  return token;
}


async function reduceStockAfterPaidOrder(tenantId: string, items: PendingOrderPayload["items"]) {
  const ids = items.map((item) => item.product_id).filter(Boolean);
  if (!ids.length) return;

  const { data: products, error } = await db
    .from("products")
    .select("id, stock_enabled, stock_quantity")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    console.error("Daraja paid order stock lookup failed", error);
    return;
  }

  for (const item of items) {
    const product = (products as Array<{ id: string; stock_enabled: boolean | null; stock_quantity: number | null }> | null | undefined)?.find((p) => p.id === item.product_id);
    if (!product?.stock_enabled) continue;
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - item.quantity);
    const { error: stockError } = await db.from("products").update({ stock_quantity: nextStock }).eq("id", product.id).eq("tenant_id", tenantId);
    if (stockError) console.error("Daraja paid order stock update failed", stockError);
  }
}

function isSuccessfulDarajaResult(intent: Record<string, any> | null | undefined) {
  return String(intent?.daraja_result_code ?? "").trim() === "0" && Boolean(getString(intent?.daraja_mpesa_receipt_number));
}

export async function createTenantDarajaStkPushIntent(input: {
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
}) {
  const currencyCode = String(input.currencyCode || "KES").toUpperCase();
  const settings = await loadTenantDarajaCustomerSettings(input.tenantId);
  assertTenantDarajaReady(settings, currencyCode);

  const phoneNumber = normalizeKenyanPhone(input.customerPhone);
  const payload: PendingOrderPayload = {
    tenantSlug: input.tenantSlug,
    tenantName: input.tenantName,
    customerName: input.customerName,
    customerPhone: phoneNumber,
    customerAccountId: input.customerAccountId,
    customerAddress: input.customerAddress,
    orderType: input.orderType,
    notes: input.notes,
    total: input.total,
    currencyCode,
    paymentProvider: "daraja",
    paymentMethodLabel: input.paymentMethodLabel,
    rewards: input.rewards || null,
    items: input.items,
  };

  const { data: intent, error: intentError } = await db
    .from("storefront_payment_intents")
    .insert({
      tenant_id: input.tenantId,
      provider: "daraja",
      status: "created",
      amount_total: input.total,
      currency_code: currencyCode,
      customer_name: input.customerName,
      customer_phone: phoneNumber,
      order_payload: payload,
    })
    .select("id")
    .single();

  if (intentError || !intent?.id) throw new Error("Could not prepare direct M-Pesa checkout.");

  const checkoutId = String(intent.id);
  const origin = storefrontReturnOrigin(input.req, input.tenantSlug);
  const waitUrl = `${origin}/checkout/payment/daraja/success?checkout_id=${encodeURIComponent(checkoutId)}`;
  const callbackUrl = getString(settings!.daraja_callback_url) || `${origin}/api/storefront/daraja/callback`;
  const timestamp = darajaTimestamp();
  const shortcode = getString(settings!.daraja_shortcode);
  const passkey = getString(settings!.daraja_passkey);
  const password = base64Encode(`${shortcode}${passkey}${timestamp}`);
  const accountReference = safeAccountReference(settings!.daraja_account_reference_prefix, checkoutId);
  const transactionDesc = `Order for ${input.tenantName}`.slice(0, 40);
  const amount = Math.max(1, Math.round(Number(input.total || 0)));
  const token = await requestDarajaToken(settings!);

  const response = await fetch(`${darajaApiBase(settings!.daraja_customer_mode)}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: getString(settings!.daraja_transaction_type) || "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as DarajaStkPushResponse | null;
  const merchantRequestId = getString(data?.MerchantRequestID);
  const checkoutRequestId = getString(data?.CheckoutRequestID);
  const responseCode = getString(data?.ResponseCode);

  if (!response.ok || responseCode !== "0" || !checkoutRequestId) {
    await db.from("storefront_payment_intents").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", checkoutId).eq("tenant_id", input.tenantId);
    throw new Error(data?.errorMessage || data?.ResponseDescription || data?.CustomerMessage || `Daraja STK Push failed with status ${response.status}`);
  }

  await db
    .from("storefront_payment_intents")
    .update({
      status: "checkout_started",
      daraja_merchant_request_id: merchantRequestId,
      daraja_checkout_request_id: checkoutRequestId,
      daraja_account_reference: accountReference,
      daraja_phone_number: phoneNumber,
      daraja_stk_response: data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .eq("tenant_id", input.tenantId);

  return { checkoutId, merchantRequestId, checkoutRequestId, accountReference, url: waitUrl, customerMessage: getString(data?.CustomerMessage) || "Check your phone and enter your M-Pesa PIN." };
}

export async function loadDarajaIntentByCheckout(input: { checkoutId?: string | null; checkoutRequestId?: string | null; merchantRequestId?: string | null }) {
  let query = db.from("storefront_payment_intents").select("id,status,order_id,tenant_id,provider,daraja_merchant_request_id,daraja_checkout_request_id,daraja_account_reference,daraja_phone_number,daraja_result_code,daraja_result_description,daraja_mpesa_receipt_number,order_payload,amount_total,currency_code,customer_name,customer_phone,created_at,updated_at");
  if (input.checkoutRequestId) query = query.eq("daraja_checkout_request_id", input.checkoutRequestId);
  else if (input.merchantRequestId) query = query.eq("daraja_merchant_request_id", input.merchantRequestId);
  else if (input.checkoutId) query = query.eq("id", input.checkoutId);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load direct M-Pesa checkout intent.");
  return data as Record<string, any> | null;
}

export async function createPaidOrderFromDarajaIntent(input: { intent: Record<string, any>; paidAt?: string | null }) {
  if (!input.intent?.id) throw new Error("Missing direct M-Pesa checkout intent.");
  if (input.intent.order_id) return input.intent.order_id as string;

  if (!isSuccessfulDarajaResult(input.intent)) {
    throw new Error("Direct M-Pesa payment has not been confirmed by Safaricom.");
  }

  const { data: claimedIntent, error: claimError } = await db
    .from("storefront_payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", input.intent.id)
    .eq("tenant_id", input.intent.tenant_id)
    .is("order_id", null)
    .in("status", ["created", "checkout_started"])
    .select("id,status,order_id,tenant_id,provider,daraja_merchant_request_id,daraja_checkout_request_id,daraja_account_reference,daraja_phone_number,daraja_result_code,daraja_result_description,daraja_mpesa_receipt_number,order_payload,amount_total,currency_code,customer_name,customer_phone,created_at,updated_at")
    .maybeSingle();

  if (claimError) throw new Error("Could not claim direct M-Pesa checkout intent.");
  if (!claimedIntent) {
    const latest = await loadDarajaIntentByCheckout({ checkoutId: input.intent.id });
    if (latest?.order_id) return latest.order_id as string;
    if (input.intent.order_id) return input.intent.order_id as string;
    throw new Error("Direct M-Pesa checkout intent could not be claimed for order creation.");
  }

  input.intent = claimedIntent;
  const payload = input.intent.order_payload as PendingOrderPayload | null;
  if (!payload?.items?.length) throw new Error("Direct M-Pesa checkout intent is missing order payload.");

  const { data: tenant, error: tenantError } = await db.from("tenants").select("id, slug, name, whatsapp_number").eq("id", input.intent.tenant_id).maybeSingle();
  if (tenantError || !tenant) throw new Error("Tenant not found for direct M-Pesa checkout intent.");

  const mpesaReceipt = getString(input.intent.daraja_mpesa_receipt_number);
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
      rewards_spend_before: payload.rewards?.rewards_spend_before ?? null,
      rewards_spend_after: payload.rewards?.rewards_spend_after ?? null,
      notes: payload.notes || null,
      payment_provider: "daraja",
      payment_method_label: payload.paymentMethodLabel || "Direct M-Pesa payment",
      payment_status: "paid",
      payment_checkout_session_id: input.intent.daraja_checkout_request_id || input.intent.id || null,
      payment_intent_id: input.intent.daraja_merchant_request_id || input.intent.daraja_checkout_request_id || null,
      payment_reference: mpesaReceipt || input.intent.daraja_checkout_request_id || input.intent.daraja_account_reference || null,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Could not create paid storefront order after direct M-Pesa payment.");

  const orderItems = payload.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) throw new Error("Could not create order items after direct M-Pesa payment.");

  await reduceStockAfterPaidOrder(tenant.id, payload.items);

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const message = buildWhatsAppOrderMessage({
    tenantName: branding.displayName,
    order,
    ...branding,
    items: payload.items.map((item) => ({ product_name: item.product_name, quantity: item.quantity, line_total: item.line_total })),
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

export async function reconcileDarajaIntent(input: { checkoutId?: string | null; checkoutRequestId?: string | null; merchantRequestId?: string | null }) {
  const intent = await loadDarajaIntentByCheckout(input);
  if (!intent) return null;
  if (intent.order_id) return { intent, status: "paid", orderId: intent.order_id as string, mpesaReceiptNumber: getString(intent.daraja_mpesa_receipt_number) || null };

  if (isSuccessfulDarajaResult(intent)) {
    const orderId = await createPaidOrderFromDarajaIntent({ intent, paidAt: new Date().toISOString() });
    return { intent: { ...intent, order_id: orderId, status: "paid" }, status: "paid", orderId, mpesaReceiptNumber: getString(intent.daraja_mpesa_receipt_number) || null };
  }

  const resultCode = getString(intent.daraja_result_code);
  if (resultCode && resultCode !== "0") {
    await db.from("storefront_payment_intents").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", intent.id).eq("tenant_id", intent.tenant_id).is("order_id", null);
    return { intent: { ...intent, status: "failed" }, status: "failed", orderId: null as string | null, mpesaReceiptNumber: null as string | null };
  }

  return { intent, status: intent.status || "checkout_started", orderId: null as string | null, mpesaReceiptNumber: getString(intent.daraja_mpesa_receipt_number) || null };
}

