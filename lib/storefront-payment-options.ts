import type { TenantSettings } from "@/lib/tenant-settings";

export type StorefrontPaymentProvider = "cash" | "cod" | "stripe" | "yoco" | "ozow" | "mpesa" | "daraja";
export type StorefrontPaymentStatus = "pay_on_fulfilment" | "pending_online_payment" | "paid" | "failed" | "cancelled" | "refunded";

export type StorefrontPaymentOption = {
  id: StorefrontPaymentProvider;
  label: string;
  shortLabel: string;
  description: string;
  status: "available" | "coming_soon" | "not_configured";
  online: boolean;
  allowedOrderTypes: Array<"delivery" | "collection">;
};

function enabled(value: boolean | null | undefined, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function configured(status: string | null | undefined) {
  return status === "configured" || status === "connected" || status === "active";
}

export function buildStorefrontPaymentOptions(settings: TenantSettings | null, orderType: "delivery" | "collection") {
  const currencyCode = String(settings?.currency_code || "GBP").toUpperCase();
  const cashCollectionEnabled = enabled(settings?.enable_cash_on_collection, true);
  const cashDeliveryEnabled = enabled(settings?.enable_cash_on_delivery, true);
  const stripeConfigured = enabled(settings?.enable_stripe_customer_payments, false) && configured(settings?.stripe_connection_status) && enabled(settings?.stripe_customer_payments_live, false);
  const yocoConfigured = currencyCode === "ZAR" && enabled(settings?.enable_yoco_customer_payments, false) && configured(settings?.yoco_connection_status) && enabled(settings?.yoco_customer_payments_live, false);
  const ozowConfigured = currencyCode === "ZAR" && enabled(settings?.enable_ozow_customer_payments, false) && configured(settings?.ozow_connection_status) && enabled(settings?.ozow_payments_live, false);
  const mpesaConfigured = currencyCode === "KES" && enabled(settings?.enable_mpesa_customer_payments, false) && configured(settings?.mpesa_connection_status) && enabled(settings?.mpesa_customer_payments_live, false);
  const darajaConfigured = currencyCode === "KES" && enabled(settings?.enable_daraja_customer_payments, false) && configured(settings?.daraja_connection_status) && enabled(settings?.daraja_payments_live, false);

  const options: StorefrontPaymentOption[] = [];

  if (stripeConfigured) {
    options.push({
      id: "stripe",
      label: "Pay securely by card",
      shortLabel: "Card payment",
      description: "Online card payment through this store owner's connected Stripe account.",
      status: "available",
      online: true,
      allowedOrderTypes: ["delivery", "collection"],
    });
  }

  if (yocoConfigured) {
    options.push({
      id: "yoco",
      label: "Pay with Yoco",
      shortLabel: "Yoco",
      description: "Online payment through this store owner’s connected Yoco account.",
      status: "available",
      online: true,
      allowedOrderTypes: ["delivery", "collection"],
    });
  }

  if (ozowConfigured) {
    options.push({
      id: "ozow",
      label: "Pay with Ozow",
      shortLabel: "Ozow",
      description: "Secure bank payment through Ozow for South African Rand stores.",
      status: "available",
      online: true,
      allowedOrderTypes: ["delivery", "collection"],
    });
  }

  if (darajaConfigured) {
    options.push({
      id: "daraja",
      label: "Pay with M-Pesa",
      shortLabel: "M-Pesa",
      description: "Direct Safaricom M-Pesa STK Push. Enter your phone number and approve the prompt on your phone.",
      status: "available",
      online: true,
      allowedOrderTypes: ["delivery", "collection"],
    });
  }

  if (mpesaConfigured) {
    options.push({
      id: "mpesa",
      label: "Pay with M-Pesa via Pesapal",
      shortLabel: "M-Pesa Pesapal",
      description: "Mobile money payment through this store owner’s connected Pesapal account.",
      status: "available",
      online: true,
      allowedOrderTypes: ["delivery", "collection"],
    });
  }

  if (orderType === "delivery" && cashDeliveryEnabled) {
    options.push({
      id: "cod",
      label: "Cash on delivery",
      shortLabel: "Cash on delivery",
      description: "Pay the store directly when your order is delivered.",
      status: "available",
      online: false,
      allowedOrderTypes: ["delivery"],
    });
  }

  if (orderType === "collection" && cashCollectionEnabled) {
    options.push({
      id: "cash",
      label: "Cash on collection",
      shortLabel: "Cash on collection",
      description: "Pay the store directly when you collect your order.",
      status: "available",
      online: false,
      allowedOrderTypes: ["collection"],
    });
  }

  const priorityByCurrency: Record<string, StorefrontPaymentProvider[]> = {
    KES: ["daraja", "mpesa", "cod", "cash", "stripe", "yoco", "ozow"],
    ZAR: ["ozow", "yoco", "cod", "cash", "stripe", "daraja", "mpesa"],
    GBP: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
    USD: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
    EUR: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
  };

  const priority = priorityByCurrency[currencyCode] || ["cash", "cod", "stripe", "yoco", "ozow", "daraja", "mpesa"];
  return options
    .filter((option) => option.allowedOrderTypes.includes(orderType))
    .sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id));
}

export function getStorefrontPaymentOption(settings: TenantSettings | null, orderType: "delivery" | "collection", paymentProvider: unknown) {
  const requested = String(paymentProvider || "").trim() as StorefrontPaymentProvider;
  const options = buildStorefrontPaymentOptions(settings, orderType);
  return options.find((option) => option.id === requested) || options[0] || null;
}
