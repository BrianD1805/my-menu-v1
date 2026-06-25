"use client";

import { useEffect, useMemo, useState } from "react";
import { cartLineKey, clearCart, readCart, writeCart } from "@/lib/cart";
import { resolveTenantSlugFromHost } from "@/lib/tenant";
import {
  DEFAULT_MONEY_SETTINGS,
  formatMoney,
  type MoneyFormatSettings,
} from "@/lib/money";
import CustomerPushNotificationsCard from "@/components/checkout/CustomerPushNotificationsCard";
import {
  calculateBestDiscount,
  getApplicableDiscounts,
  normalizeDiscountRules,
  type DiscountRule,
} from "@/lib/discounts";
import {
  calculatePreorderFinancials,
  isPreorderProduct,
  normalizePreorderDepositPercent,
} from "@/lib/preorders";

type CartItem = {
  productId: string;
  quantity: number;
  unitPrice?: number | null;
  basePrice?: number | null;
  variantId?: string | null;
  variantName?: string | null;
  variantLabel?: string | null;
  variantPriceDelta?: number | null;
  variantPrice?: number | null;
  variantDescription?: string | null;
  variantStockEnabled?: boolean | null;
  customAmount?: number | null;
  customAmountReference?: string | null;
  customAmountNote?: string | null;
  customAmountLabel?: string | null;
};

type ProductVariant = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  priceDelta?: number | null;
  stockEnabled?: boolean | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  isActive: boolean;
};

function hasNumberValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getVariantPrice(
  basePrice: number,
  variant: ProductVariant | null | undefined,
  fallbackPrice?: number | null,
  fallbackDelta?: number | null,
) {
  const explicitPrice = hasNumberValue(variant?.price)
    ? Number(variant?.price)
    : Number.NaN;
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0)
    return explicitPrice;

  const storedPrice = hasNumberValue(fallbackPrice)
    ? Number(fallbackPrice)
    : Number.NaN;
  if (Number.isFinite(storedPrice) && storedPrice >= 0) return storedPrice;

  const legacyDeltaRaw = hasNumberValue(variant?.priceDelta)
    ? variant?.priceDelta
    : fallbackDelta;
  const legacyDelta = hasNumberValue(legacyDeltaRaw)
    ? Number(legacyDeltaRaw)
    : Number.NaN;
  return Math.max(
    0,
    Number(basePrice || 0) + (Number.isFinite(legacyDelta) ? legacyDelta : 0),
  );
}

function resolveProductLinePrice(
  productPrice: number,
  cartUnitPrice?: number | null,
  cartBasePrice?: number | null,
) {
  const livePrice = Number(productPrice);
  if (Number.isFinite(livePrice) && livePrice > 0) return livePrice;

  const snapshotPrice = Number(cartUnitPrice ?? cartBasePrice);
  if (Number.isFinite(snapshotPrice) && snapshotPrice > 0) return snapshotPrice;

  return Math.max(0, Number.isFinite(livePrice) ? livePrice : 0);
}

type Product = {
  id: string;
  name: string;
  price: number;
  stock_enabled?: boolean | null;
  stock_quantity?: number | null;
  variants_enabled?: boolean | null;
  variant_label?: string | null;
  product_variants?: ProductVariant[] | null;
  product_type?: string | null;
  custom_amount_enabled?: boolean | null;
  custom_amount_label?: string | null;
  custom_amount_reference_label?: string | null;
  custom_amount_reference_required?: boolean | null;
  custom_amount_min?: number | null;
  custom_amount_max?: number | null;
  custom_amount_help_text?: string | null;
  custom_amount_disable_rewards?: boolean | null;
  custom_amount_disable_discounts?: boolean | null;
  preorder_enabled?: boolean | null;
  preorder_when_out_of_stock?: boolean | null;
};

type TenantTrialState = {
  checkoutBlocked?: boolean;
  isTrialExpired?: boolean;
  customerMessage?: string | null;
  trialEndsAt?: string | null;
  trialDaysRemaining?: number | null;
};

type CustomerRewardSummary = {
  enabled: boolean;
  programName: string;
  tier: "silver" | "gold" | "platinum";
  tierLabel: string;
  discountPercent: number;
  qualifyingSpend: number;
  nextTier: "silver" | "gold" | "platinum" | null;
  nextTierLabel: string | null;
  spendToNextTier: number;
  progressPercent: number;
};

type TenantViewSettings = MoneyFormatSettings & {
  currencyCode?: string;
  currencySymbol?: string;
  currencyName?: string;
  displayName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactAddress?: string;
  footerBlurb?: string;
  footerNotice?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundTint?: string;
  borderColor?: string;
  textColor?: string;
  trialState?: TenantTrialState | null;
  enableCashOnCollection?: boolean;
  enableCashOnDelivery?: boolean;
  enableStripeCustomerPayments?: boolean;
  stripeConnectionStatus?: string;
  stripeCustomerPaymentsLive?: boolean;
  enableYocoCustomerPayments?: boolean;
  yocoConnectionStatus?: string;
  yocoCustomerPaymentsLive?: boolean;
  enableOzowCustomerPayments?: boolean;
  ozowConnectionStatus?: string;
  ozowPaymentsLive?: boolean;
  enablePayfastCustomerPayments?: boolean;
  payfastConnectionStatus?: string;
  payfastPaymentsLive?: boolean;
  enableMpesaCustomerPayments?: boolean;
  mpesaConnectionStatus?: string;
  mpesaCustomerPaymentsLive?: boolean;
  enableDarajaCustomerPayments?: boolean;
  darajaConnectionStatus?: string;
  darajaPaymentsLive?: boolean;
  rewardsEnabled?: boolean;
  rewardsProgramName?: string;
  discountsEnabled?: boolean;
  discountPopupTitle?: string;
  discountPopupMessage?: string;
  discountRules?: DiscountRule[];
  preordersEnabled?: boolean;
  preorderDepositPercent?: number | null;
};

type PaymentProvider =
  | "cash"
  | "cod"
  | "stripe"
  | "yoco"
  | "ozow"
  | "payfast"
  | "mpesa"
  | "daraja";

type PaymentOption = {
  id: PaymentProvider;
  label: string;
  description: string;
  online: boolean;
};

type SuccessState = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderType: "delivery" | "collection";
  customerAddress: string;
  notes: string;
  total: number;
  itemCount: number;
  paymentMethodLabel: string;
  paymentStatus: string;
  hasPreorder?: boolean;
  preorderDepositAmount?: number;
  preorderBalanceAmount?: number;
  preorderDepositPercent?: number;
  tenantSlug: string;
  whatsappPaused: boolean;
  whatsappUrl: string | null;
  whatsappAppUrl: string | null;
};

type CustomerAccount = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  rewards?: CustomerRewardSummary | null;
};

function providerConfigured(
  enabled: boolean | undefined,
  status: string | undefined,
  live = true,
) {
  return (
    enabled === true &&
    live === true &&
    ["configured", "connected", "active"].includes(String(status || ""))
  );
}

function buildPaymentOptions(
  settings: TenantViewSettings,
  orderType: "delivery" | "collection",
): PaymentOption[] {
  const currencyCode = String(settings.currencyCode || "GBP").toUpperCase();
  const options: PaymentOption[] = [];

  if (
    providerConfigured(
      settings.enableStripeCustomerPayments,
      settings.stripeConnectionStatus,
      settings.stripeCustomerPaymentsLive === true,
    )
  ) {
    options.push({
      id: "stripe",
      label: "Pay securely by card",
      description:
        "Online card payment through this store owner’s connected Stripe account.",
      online: true,
    });
  }

  if (
    currencyCode === "ZAR" &&
    providerConfigured(
      settings.enableYocoCustomerPayments,
      settings.yocoConnectionStatus,
      settings.yocoCustomerPaymentsLive === true,
    )
  ) {
    options.push({
      id: "yoco",
      label: "Pay with Yoco",
      description:
        "Online payment through this store owner’s connected Yoco account.",
      online: true,
    });
  }

  if (
    currencyCode === "ZAR" &&
    providerConfigured(
      settings.enableOzowCustomerPayments,
      settings.ozowConnectionStatus,
      settings.ozowPaymentsLive === true,
    )
  ) {
    options.push({
      id: "ozow",
      label: "Pay with Ozow",
      description:
        "Secure bank payment through Ozow for South African Rand stores.",
      online: true,
    });
  }

  if (
    currencyCode === "ZAR" &&
    providerConfigured(
      settings.enablePayfastCustomerPayments,
      settings.payfastConnectionStatus,
      settings.payfastPaymentsLive === true,
    )
  ) {
    options.push({
      id: "payfast",
      label: "Pay with PayFast",
      description:
        "Secure hosted PayFast checkout for South African Rand stores.",
      online: true,
    });
  }

  if (
    currencyCode === "KES" &&
    providerConfigured(
      settings.enableDarajaCustomerPayments,
      settings.darajaConnectionStatus,
      settings.darajaPaymentsLive === true,
    )
  ) {
    options.push({
      id: "daraja",
      label: "Pay with M-Pesa",
      description:
        "Direct Safaricom STK Push. Enter your phone number and approve the prompt on your phone.",
      online: true,
    });
  }

  if (
    currencyCode === "KES" &&
    providerConfigured(
      settings.enableMpesaCustomerPayments,
      settings.mpesaConnectionStatus,
      settings.mpesaCustomerPaymentsLive === true,
    )
  ) {
    options.push({
      id: "mpesa",
      label: "Pay with M-Pesa via Pesapal",
      description:
        "Mobile money payment through this store owner’s connected Pesapal account.",
      online: true,
    });
  }

  if (orderType === "delivery" && settings.enableCashOnDelivery !== false) {
    options.push({
      id: "cod",
      label: "Cash on delivery",
      description: "Pay the store directly when your order is delivered.",
      online: false,
    });
  }

  if (orderType === "collection" && settings.enableCashOnCollection !== false) {
    options.push({
      id: "cash",
      label: "Cash on collection",
      description: "Pay the store directly when you collect your order.",
      online: false,
    });
  }

  const priorityByCurrency: Record<string, PaymentProvider[]> = {
    KES: [
      "daraja",
      "mpesa",
      "cod",
      "cash",
      "stripe",
      "yoco",
      "ozow",
      "payfast",
    ],
    ZAR: [
      "payfast",
      "ozow",
      "yoco",
      "cod",
      "cash",
      "stripe",
      "daraja",
      "mpesa",
    ],
    GBP: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
    USD: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
    EUR: ["stripe", "cash", "cod", "yoco", "ozow", "daraja", "mpesa"],
  };
  const priority = priorityByCurrency[currencyCode] || [
    "cash",
    "cod",
    "stripe",
    "yoco",
    "ozow",
    "payfast",
    "daraja",
    "mpesa",
  ];
  return options.sort(
    (a, b) => priority.indexOf(a.id) - priority.indexOf(b.id),
  );
}

function buildSavedAddress(customer: CustomerAccount | null) {
  if (!customer) return "";
  return [
    customer.addressLine1,
    customer.addressLine2,
    customer.city,
    customer.postcode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantResolved, setTenantResolved] = useState(false);
  const [customerAccount, setCustomerAccount] =
    useState<CustomerAccount | null>(null);
  const [customerAccountLoading, setCustomerAccountLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">(
    "delivery",
  );
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("cod");
  const [saveDetailsToAccount, setSaveDetailsToAccount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCheckoutSubmitLoading, setShowCheckoutSubmitLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantViewSettings>({
    ...DEFAULT_MONEY_SETTINGS,
  });
  const [discountCode, setDiscountCode] = useState("");
  const [discountsModalOpen, setDiscountsModalOpen] = useState(false);

  useEffect(() => {
    if (!successState) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [successState?.orderId]);

  useEffect(() => {
    if (!loading) {
      setShowCheckoutSubmitLoading(false);
      return;
    }

    const timer = window.setTimeout(
      () => setShowCheckoutSubmitLoading(true),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    async function loadCustomerAccount() {
      setCustomerAccountLoading(true);
      const startedAt = performance.now();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch("/api/customer/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.customer) {
          setCustomerAccount(data.customer);
          if (data.customer.fullName) {
            setCustomerName((current) => current || data.customer.fullName);
          }
          if (data.customer.phone) {
            setCustomerPhone((current) => current || data.customer.phone);
          }
          const savedAddress = buildSavedAddress(data.customer);
          if (savedAddress) {
            setCustomerAddress((current) => current || savedAddress);
          }
        } else {
          setCustomerAccount(null);
        }
      } catch {
        setCustomerAccount(null);
      } finally {
        window.clearTimeout(timeout);
        setCustomerAccountLoading(false);
        console.info(
          `[Orduva load] checkout customer profile prefill: ${Math.round(performance.now() - startedAt)}ms`,
        );
      }
    }

    void loadCustomerAccount();
  }, []);

  useEffect(() => {
    try {
      const savedSlug =
        window.localStorage.getItem("orduva_active_tenant_slug") || "";
      const savedTenantId =
        window.localStorage.getItem("orduva_active_tenant_id") || "";
      const fallbackSlug = resolveTenantSlugFromHost(window.location.host);

      setTenantSlug(savedSlug || fallbackSlug);
      setTenantId(savedTenantId || "");
    } finally {
      setTenantResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!tenantResolved || !tenantSlug) return;
    setItems(readCart<CartItem>(tenantSlug));
  }, [tenantResolved, tenantSlug]);

  useEffect(() => {
    async function loadProducts() {
      const startedAt = performance.now();
      try {
        const res = await fetch(`/api/products?tenantSlug=${tenantSlug}`);
        const data = await res.json();
        if (res.ok) {
          setProducts(data.products || []);
          setTenantSettings({
            ...DEFAULT_MONEY_SETTINGS,
            ...(data.settings || {}),
          });
        }
      } finally {
        console.info(
          `[Orduva load] checkout products/settings: ${Math.round(performance.now() - startedAt)}ms`,
        );
      }
    }

    if (tenantResolved && tenantSlug) {
      void loadProducts();
    }
  }, [tenantResolved, tenantSlug]);

  useEffect(() => {
    if (!tenantResolved || !tenantSlug || !products.length || !items.length)
      return;

    const normalItems = items.filter((item) => {
      if (item.customAmount !== undefined && item.customAmount !== null)
        return false;
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      );
      if (!product) return true;
      return !(
        product.product_type === "customer_amount" ||
        product.custom_amount_enabled === true
      );
    });

    if (normalItems.length !== items.length) {
      writeCart(tenantSlug, normalItems);
      setItems(normalItems);
    }
  }, [items, products, tenantResolved, tenantSlug]);

  const cartRows = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        const isCustomAmountProduct =
          product.product_type === "customer_amount" ||
          product.custom_amount_enabled === true;
        const variant = Array.isArray(product.product_variants)
          ? product.product_variants.find(
              (option) =>
                option.id === item.variantId && option.isActive !== false,
            )
          : null;
        const variantName = variant?.name || item.variantName || null;
        const productBasePrice = resolveProductLinePrice(
          Number(product.price || 0),
          item.unitPrice,
          item.basePrice,
        );
        const unitPrice = isCustomAmountProduct
          ? Math.max(0, Number(item.customAmount || 0))
          : getVariantPrice(
              productBasePrice,
              variant,
              item.variantPrice,
              item.variantPriceDelta,
            );
        const lineTotal = unitPrice * item.quantity;
        const selectedVariantForPreorder =
          variant ||
          (item.variantId
            ? {
                id: item.variantId,
                name: item.variantName || "",
                price: item.variantPrice ?? null,
                priceDelta: item.variantPriceDelta ?? null,
                stockEnabled: item.variantStockEnabled ?? null,
                stockQuantity: null,
                isActive: true,
              }
            : null);
        const isPreorder =
          !isCustomAmountProduct &&
          tenantSettings.preordersEnabled !== false &&
          isPreorderProduct(product, selectedVariantForPreorder);

        return {
          ...item,
          name: product.name,
          variantName,
          variantLabel: product.variant_label || item.variantLabel || null,
          variantDescription:
            variant?.description || item.variantDescription || null,
          unitPrice,
          basePrice: productBasePrice,
          lineTotal,
          stockEnabled: isCustomAmountProduct ? false : !!product.stock_enabled,
          stockQuantity: isCustomAmountProduct
            ? 999999
            : Math.max(0, Number(product.stock_quantity || 0)),
          isPreorder,
          isCustomAmountProduct,
          customAmountReference: item.customAmountReference || null,
          customAmountNote: item.customAmountNote || null,
          customAmountLabel:
            item.customAmountLabel ||
            product.custom_amount_label ||
            "Amount to pay",
          customAmountDisableRewards:
            product.custom_amount_disable_rewards !== false,
          customAmountDisableDiscounts:
            product.custom_amount_disable_discounts !== false,
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      variantId?: string | null;
      variantName?: string | null;
      variantLabel?: string | null;
      variantDescription?: string | null;
      name: string;
      unitPrice: number;
      lineTotal: number;
      stockEnabled: boolean;
      stockQuantity: number;
      isCustomAmountProduct?: boolean;
      customAmountReference?: string | null;
      customAmountNote?: string | null;
      customAmountLabel?: string | null;
      customAmountDisableRewards?: boolean;
      customAmountDisableDiscounts?: boolean;
      isPreorder?: boolean;
    }>;
  }, [items, products]);

  const total = useMemo(
    () => cartRows.reduce((sum, row) => sum + row.lineTotal, 0),
    [cartRows],
  );
  const hasCustomAmountLines = cartRows.some(
    (row) => row.isCustomAmountProduct,
  );
  const customAmountDisablesRewards = cartRows.some(
    (row) =>
      row.isCustomAmountProduct && row.customAmountDisableRewards !== false,
  );
  const customAmountDisablesDiscounts = cartRows.some(
    (row) =>
      row.isCustomAmountProduct && row.customAmountDisableDiscounts !== false,
  );
  const rewardSummary =
    !customAmountDisablesRewards &&
    customerAccount?.rewards &&
    customerAccount.rewards.enabled
      ? customerAccount.rewards
      : null;
  const rewardDiscountPercent = Number(rewardSummary?.discountPercent || 0);
  const rewardDiscountAmount = useMemo(
    () => Math.min(total, Math.round(total * rewardDiscountPercent) / 100),
    [total, rewardDiscountPercent],
  );
  const totalAfterRewards = Math.max(
    0,
    Math.round((total - rewardDiscountAmount) * 100) / 100,
  );
  const discountRules = useMemo(
    () => normalizeDiscountRules(tenantSettings.discountRules || []),
    [tenantSettings.discountRules],
  );
  const discountCartLines = useMemo(
    () =>
      cartRows.map((row) => ({
        productId: row.productId,
        quantity: row.quantity,
        lineTotal: row.lineTotal,
      })),
    [cartRows],
  );
  const visibleDiscounts = useMemo(
    () =>
      getApplicableDiscounts({
        settings: tenantSettings,
        cartLines: discountCartLines,
        subtotal: total,
        includeVisibleAutomatic: true,
      }).filter((item) => item.rule.showOnCheckout !== false),
    [tenantSettings, discountCartLines, total],
  );
  const discountResult = useMemo(
    () =>
      customAmountDisablesDiscounts
        ? ({
            applied: false,
            rewardAllowed: true,
            totalAfterDiscount: totalAfterRewards,
            name: null,
            code: null,
            amount: 0,
          } as any)
        : calculateBestDiscount({
            settings: tenantSettings,
            cartLines: discountCartLines,
            subtotal: total,
            code: discountCode,
            rewardDiscountAmount,
          }),
    [
      customAmountDisablesDiscounts,
      tenantSettings,
      discountCartLines,
      total,
      discountCode,
      rewardDiscountAmount,
      totalAfterRewards,
    ],
  );
  const effectiveRewardDiscountAmount =
    discountResult.applied && !discountResult.rewardAllowed
      ? 0
      : rewardDiscountAmount;
  const totalAfterDiscounts = discountResult.applied
    ? discountResult.totalAfterDiscount
    : totalAfterRewards;
  const preorderFullSubtotal = useMemo(
    () =>
      cartRows.reduce(
        (sum, row) => sum + (row.isPreorder ? row.lineTotal : 0),
        0,
      ),
    [cartRows],
  );
  const preorderDepositPercent = normalizePreorderDepositPercent(
    tenantSettings.preorderDepositPercent ?? 25,
  );
  const preorderFinancials = useMemo(
    () =>
      calculatePreorderFinancials({
        lineSubtotal: totalAfterDiscounts,
        preorderSubtotal: Math.min(preorderFullSubtotal, totalAfterDiscounts),
        depositPercent: preorderDepositPercent,
      }),
    [totalAfterDiscounts, preorderFullSubtotal, preorderDepositPercent],
  );
  const amountDueNow = preorderFinancials.hasPreorder
    ? preorderFinancials.amountDueNow
    : totalAfterDiscounts;

  const checkoutPrimary = tenantSettings.primaryColor || "#7B1E22";
  const checkoutAccent = tenantSettings.accentColor || "#C7922F";
  const checkoutBackground = tenantSettings.backgroundTint || "#F8F4F0";
  const checkoutBorder = tenantSettings.borderColor || "#D9C7A3";
  const checkoutText = tenantSettings.textColor || "#2B2B2B";
  const trialState = tenantSettings.trialState || null;
  const checkoutBlockedByTrial = Boolean(
    trialState?.checkoutBlocked || trialState?.isTrialExpired,
  );
  const checkoutBlockedMessage =
    trialState?.customerMessage ||
    "This store is temporarily unable to accept checkout orders while the owner renews their Orduva plan. You can still browse the menu.";
  const paymentOptions = useMemo(
    () => buildPaymentOptions(tenantSettings, orderType),
    [tenantSettings, orderType],
  );
  const selectedPaymentOption =
    paymentOptions.find((option) => option.id === paymentProvider) ||
    paymentOptions[0] ||
    null;

  useEffect(() => {
    if (!paymentOptions.length) return;
    if (!paymentOptions.some((option) => option.id === paymentProvider)) {
      setPaymentProvider(paymentOptions[0].id);
    }
  }, [paymentOptions, paymentProvider]);

  function attemptWhatsAppHandoff(
    webUrl: string | null,
    appUrl: string | null,
  ) {
    const fallbackUrl = webUrl?.trim() || null;
    const appFirstUrl = appUrl?.trim() || fallbackUrl;
    if (!appFirstUrl) return;

    let fallbackTimer: number | null = null;
    const clearFallback = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearFallback();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange, {
      once: true,
    });

    if (fallbackUrl && appFirstUrl !== fallbackUrl) {
      fallbackTimer = window.setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 1200);
    }

    window.location.href = appFirstUrl;
  }

  function updateQuantity(targetItem: CartItem, nextQuantity: number) {
    const product = products.find((p) => p.id === targetItem.productId);
    const otherProductQuantity = items
      .filter(
        (x) =>
          x.productId === targetItem.productId &&
          cartLineKey(x) !== cartLineKey(targetItem),
      )
      .reduce((sum, x) => sum + Math.max(0, Number(x.quantity || 0)), 0);
    const maxForLine = product?.stock_enabled
      ? Math.max(0, Number(product.stock_quantity || 0)) - otherProductQuantity
      : nextQuantity;
    const cappedQuantity = product?.stock_enabled
      ? Math.min(nextQuantity, maxForLine)
      : nextQuantity;
    const nextItems =
      cappedQuantity <= 0
        ? items.filter((x) => cartLineKey(x) !== cartLineKey(targetItem))
        : items.map((x) =>
            cartLineKey(x) === cartLineKey(targetItem)
              ? { ...x, quantity: cappedQuantity }
              : x,
          );

    setItems(nextItems);
    writeCart(tenantSlug, nextItems);
  }

  function applySavedProfileToCheckout(customer = customerAccount) {
    if (!customer) return;
    setCustomerName(customer.fullName || "");
    setCustomerPhone(customer.phone || "");
    setCustomerAddress(buildSavedAddress(customer));
  }

  function resetCheckoutForNewOrder() {
    setSuccessState(null);
    if (customerAccount) {
      applySavedProfileToCheckout(customerAccount);
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    }
    setNotes("");
    setOrderType("delivery");
    setPaymentProvider("cod");
    setErrorMessage("");
  }

  const PAUSE_WHATSAPP_FOR_TESTING = true;

  async function saveCheckoutDetailsToProfile() {
    if (!customerAccount || !saveDetailsToAccount) return;

    const payload: Record<string, string> = {
      fullName: customerName,
      phone: customerPhone,
    };
    const savedAddress = buildSavedAddress(customerAccount);
    if (customerAddress.trim() !== savedAddress) {
      payload.checkoutAddress = customerAddress;
    }

    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.customer) {
      setCustomerAccount(data.customer);
    }
  }

  async function placeOrder() {
    setErrorMessage("");

    if (checkoutBlockedByTrial) {
      setErrorMessage(checkoutBlockedMessage);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Please enter customer name.");
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("Please enter phone number.");
      return;
    }

    if (!items.length) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!selectedPaymentOption) {
      setErrorMessage(
        "No payment method is currently available for this order type. Please contact the store.",
      );
      return;
    }

    const overStock = cartRows.find((row) => {
      if (!row.stockEnabled) return false;
      const totalForProduct = cartRows
        .filter((line) => line.productId === row.productId)
        .reduce((sum, line) => sum + line.quantity, 0);
      return totalForProduct > row.stockQuantity;
    });
    if (overStock) {
      setErrorMessage(
        `${overStock.name} only has ${overStock.stockQuantity} in stock. Please adjust your cart.`,
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerAccountId: customerAccount?.id || null,
          tenantSlug,
          tenantId,
          customerName,
          customerPhone,
          customerAddress,
          orderType,
          notes,
          paymentProvider: selectedPaymentOption.id,
          discountCode: discountCode.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId || null,
            customAmount: item.customAmount || null,
            customAmountReference: item.customAmountReference || null,
            customAmountNote: item.customAmountNote || null,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to place order.");
        setLoading(false);
        return;
      }

      await saveCheckoutDetailsToProfile();

      if (
        selectedPaymentOption.online &&
        (data.stripeCheckoutUrl ||
          data.yocoCheckoutUrl ||
          data.ozowCheckoutUrl ||
          data.payfastCheckoutUrl ||
          data.mpesaCheckoutUrl ||
          data.darajaCheckoutUrl)
      ) {
        setErrorMessage("");
        window.location.assign(
          data.stripeCheckoutUrl ||
            data.yocoCheckoutUrl ||
            data.ozowCheckoutUrl ||
            data.payfastCheckoutUrl ||
            data.darajaCheckoutUrl ||
            data.mpesaCheckoutUrl,
        );
        return;
      }

      clearCart(tenantSlug);
      setItems([]);
      setSuccessState({
        orderId: data.orderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        customerAddress: customerAddress.trim(),
        notes: notes.trim(),
        total: preorderFinancials.hasPreorder
          ? totalAfterDiscounts
          : amountDueNow,
        itemCount: cartRows.reduce((sum, row) => sum + row.quantity, 0),
        paymentMethodLabel:
          data.paymentMethodLabel || selectedPaymentOption.label,
        paymentStatus: data.paymentStatus || "pay_on_fulfilment",
        hasPreorder: preorderFinancials.hasPreorder,
        preorderDepositAmount: preorderFinancials.depositAmount,
        preorderBalanceAmount: preorderFinancials.balanceAmount,
        preorderDepositPercent: preorderFinancials.depositPercent,
        tenantSlug,
        whatsappPaused: PAUSE_WHATSAPP_FOR_TESTING,
        whatsappUrl: data.whatsappUrl || null,
        whatsappAppUrl: data.whatsappAppUrl || null,
      });
      setLoading(false);

      if (
        !PAUSE_WHATSAPP_FOR_TESTING &&
        (data.whatsappAppUrl || data.whatsappUrl)
      ) {
        window.setTimeout(() => {
          attemptWhatsAppHandoff(
            data.whatsappUrl || null,
            data.whatsappAppUrl || null,
          );
        }, 150);
      }
    } catch {
      setErrorMessage("Something went wrong while placing the order.");
      setLoading(false);
    }
  }

  if (successState) {
    return (
      <main
        className="min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundColor: checkoutBackground }}
      >
        <div
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
          style={{ borderColor: checkoutBorder }}
        >
          <section
            className="relative overflow-hidden px-6 py-8 text-white sm:px-8 sm:py-10"
            style={{
              background: `linear-gradient(135deg, ${checkoutPrimary} 0%, color-mix(in srgb, ${checkoutPrimary} 78%, ${checkoutAccent}) 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/18 text-3xl ring-1 ring-white/30 backdrop-blur-sm">
                  ✓
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  Order confirmed
                </p>
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Thanks, {successState.customerName}. Your order is in.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                  {successState.hasPreorder
                    ? `We’ve received your pre-order deposit and sent the order through to the team. The balance will be requested when stock arrives.`
                    : `We’ve received your order and sent it through to the team. ${successState.paymentStatus === "pay_on_fulfilment" ? "Payment will be handled directly by the store." : "Your payment status has been recorded with the order."}`}
                </p>
              </div>

              <div className="rounded-[26px] bg-white/14 p-4 text-sm ring-1 ring-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/75">
                    {successState.hasPreorder ? "Order total" : "Total"}
                  </span>
                  <span className="text-lg font-bold">
                    {formatMoney(successState.total, tenantSettings)}
                  </span>
                </div>
                {successState.hasPreorder ? (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                      <span className="text-white/75">Deposit paid</span>
                      <span className="font-semibold">
                        {formatMoney(
                          successState.preorderDepositAmount || 0,
                          tenantSettings,
                        )}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                      <span className="text-white/75">Balance later</span>
                      <span className="font-semibold">
                        {formatMoney(
                          successState.preorderBalanceAmount || 0,
                          tenantSettings,
                        )}
                      </span>
                    </div>
                  </>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                  <span className="text-white/75">Items</span>
                  <span className="font-semibold">
                    {successState.itemCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                  <span className="text-white/75">Payment</span>
                  <span className="text-right font-semibold">
                    {successState.paymentMethodLabel}
                  </span>
                </div>
                <div className="mt-3 border-t border-white/15 pt-3">
                  <p className="text-white/75">Reference</p>
                  <p className="mt-1 break-all font-semibold">
                    {successState.orderId}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <CustomerPushNotificationsCard
                tenantSlug={successState.tenantSlug}
                orderId={successState.orderId}
                customerPhone={successState.customerPhone}
                customerName={successState.customerName}
                customerAccountId={customerAccount?.id || null}
              />

              <div
                className="rounded-[28px] border bg-white p-5 shadow-sm"
                style={{ borderColor: checkoutBorder }}
              >
                <p className="text-sm font-semibold text-gray-950">
                  What happens next
                </p>
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: checkoutBackground,
                        color: checkoutPrimary,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {successState.hasPreorder
                          ? "The team manages your pre-order"
                          : "The team reviews your order"}
                      </p>
                      <p className="text-sm leading-6 text-gray-600">
                        {successState.hasPreorder
                          ? "You’ll be updated when stock arrives and the balance is ready to pay."
                          : "You’ll be updated when it is accepted and being prepared."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: checkoutBackground,
                        color: checkoutPrimary,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Keep this page or your phone nearby
                      </p>
                      <p className="text-sm leading-6 text-gray-600">
                        If you enable updates, this device can receive order
                        status notifications
                        {successState.hasPreorder
                          ? " and the balance payment link."
                          : "."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: checkoutBackground,
                        color: checkoutPrimary,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Come back to the menu any time
                      </p>
                      <p className="text-sm leading-6 text-gray-600">
                        Your cart has been cleared so your next order starts
                        fresh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {successState.notes ? (
                <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Your order notes
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {successState.notes}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="space-y-5">
              <div
                className="rounded-[28px] border bg-white p-5 shadow-sm"
                style={{ borderColor: checkoutBorder }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Order details
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500">Order type</p>
                    <p className="mt-1 font-semibold capitalize text-gray-950">
                      {successState.orderType}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment method</p>
                    <p className="mt-1 font-semibold text-gray-950">
                      {successState.paymentMethodLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="mt-1 font-semibold text-gray-950">
                      {successState.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">
                      {successState.orderType === "collection"
                        ? "Collection"
                        : "Delivery address"}
                    </p>
                    <p className="mt-1 leading-6 font-semibold text-gray-950">
                      {successState.orderType === "collection"
                        ? "Collection order"
                        : successState.customerAddress || "No address supplied"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  {successState.whatsappAppUrl || successState.whatsappUrl ? (
                    <button
                      onClick={() =>
                        attemptWhatsAppHandoff(
                          successState.whatsappUrl,
                          successState.whatsappAppUrl,
                        )
                      }
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: checkoutPrimary }}
                    >
                      Send on WhatsApp
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      resetCheckoutForNewOrder();
                      window.location.href = "/";
                    }}
                    className="w-full rounded-2xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Back to menu
                  </button>
                  <button
                    onClick={() => resetCheckoutForNewOrder()}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    Start another order
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">
                  {tenantSettings.displayName || "Business details"}
                </p>
                <div className="mt-2 space-y-1">
                  {tenantSettings.contactPhone ? (
                    <p>Phone: {tenantSettings.contactPhone}</p>
                  ) : null}
                  {tenantSettings.contactEmail ? (
                    <p>Email: {tenantSettings.contactEmail}</p>
                  ) : null}
                  {tenantSettings.contactAddress ? (
                    <p>Address: {tenantSettings.contactAddress}</p>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-3xl p-6"
      style={{ backgroundColor: checkoutBackground }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: checkoutBorder, color: checkoutPrimary }}
          aria-label="Back to storefront"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: checkoutBackground,
              color: checkoutPrimary,
            }}
            aria-hidden="true"
          >
            ←
          </span>
          <span className="hidden sm:inline">Back to storefront</span>
        </button>
      </div>

      <h1
        className="mb-2 text-3xl font-bold"
        style={{ color: checkoutPrimary }}
      >
        Checkout
      </h1>
      <p className="mb-6" style={{ color: checkoutText }}>
        Review your order first, check your sign-in details, then choose how you
        would like to pay.
      </p>

      <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <aside
          className="rounded-2xl border bg-white p-4 shadow-sm"
          style={{ borderColor: checkoutBorder }}
        >
          <h2
            className="mb-4 text-xl font-semibold"
            style={{ color: checkoutPrimary }}
          >
            Order summary
          </h2>

          {!cartRows.length ? (
            <p className="text-sm text-gray-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cartRows.map((row) => (
                <div
                  key={cartLineKey(row)}
                  className="rounded-xl border p-3"
                  style={{ borderColor: checkoutBorder }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      {row.variantName ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {row.variantLabel || "Option"}: {row.variantName}
                        </p>
                      ) : null}
                      {row.variantDescription ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {row.variantDescription}
                        </p>
                      ) : null}
                      {row.isCustomAmountProduct &&
                      row.customAmountReference ? (
                        <p className="mt-1 text-xs font-semibold text-blue-700">
                          Reference: {row.customAmountReference}
                        </p>
                      ) : null}
                      {row.isCustomAmountProduct && row.customAmountNote ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {row.customAmountNote}
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-600">
                        {row.isCustomAmountProduct
                          ? row.customAmountLabel || "Amount"
                          : formatMoney(row.unitPrice, tenantSettings) +
                            " each"}
                      </p>
                      {row.isPreorder ? (
                        <p className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Pre-order deposit at checkout
                        </p>
                      ) : row.stockEnabled ? (
                        <p
                          className={`mt-1 text-xs font-semibold ${row.stockQuantity <= 0 ? "text-red-600" : row.quantity >= row.stockQuantity ? "text-orange-600" : "text-emerald-700"}`}
                        >
                          {row.stockQuantity <= 0
                            ? "Out of stock"
                            : `${row.stockQuantity} in stock`}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-medium">
                      {formatMoney(row.lineTotal, tenantSettings)}
                    </p>
                  </div>

                  {row.isCustomAmountProduct ? null : (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="rounded border px-3 py-1"
                        style={{ borderColor: checkoutBorder }}
                        onClick={() => updateQuantity(row, row.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{row.quantity}</span>
                      <button
                        className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderColor: checkoutBorder }}
                        onClick={() => updateQuantity(row, row.quantity + 1)}
                        disabled={
                          !row.isPreorder &&
                          row.stockEnabled &&
                          row.quantity >= row.stockQuantity
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span>Subtotal</span>
                  <span className="min-w-[120px] text-right tabular-nums">
                    {formatMoney(total, tenantSettings)}
                  </span>
                </div>
                {rewardSummary && effectiveRewardDiscountAmount > 0 ? (
                  <div className="flex items-start justify-between gap-4 text-emerald-700">
                    <span>{rewardSummary.tierLabel} rewards discount</span>
                    <span className="min-w-[120px] text-right tabular-nums">
                      -
                      {formatMoney(
                        effectiveRewardDiscountAmount,
                        tenantSettings,
                      )}
                    </span>
                  </div>
                ) : rewardSummary &&
                  discountResult.applied &&
                  !discountResult.rewardAllowed ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Reward discount paused because this offer cannot be combined
                    with rewards.
                  </div>
                ) : rewardSummary ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                    {rewardSummary.tierLabel} rewards member. Keep ordering to
                    unlock higher tier discounts.
                  </div>
                ) : null}
                {discountResult.applied ? (
                  <div className="flex items-start justify-between gap-4 text-rose-700">
                    <span>
                      {discountResult.name || "Discount"}
                      {discountResult.code ? ` (${discountResult.code})` : ""}
                    </span>
                    <span className="min-w-[120px] text-right tabular-nums">
                      -{formatMoney(discountResult.amount, tenantSettings)}
                    </span>
                  </div>
                ) : null}
                {preorderFinancials.hasPreorder ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                    <div className="flex items-start justify-between gap-4">
                      <span>Total Due:</span>
                      <span className="min-w-[120px] text-right tabular-nums">
                        {formatMoney(
                          preorderFinancials.preorderSubtotal,
                          tenantSettings,
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-4 font-semibold">
                      <span>
                        Deposit ({preorderFinancials.depositPercent}%)
                      </span>
                      <span className="min-w-[120px] text-right tabular-nums">
                        {formatMoney(
                          preorderFinancials.depositAmount,
                          tenantSettings,
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <span>Balance Due:</span>
                      <span className="min-w-[120px] text-right tabular-nums">
                        {formatMoney(
                          preorderFinancials.balanceAmount,
                          tenantSettings,
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-4 pt-2 text-base font-semibold">
                  <span>
                    {preorderFinancials.hasPreorder ? "Due now" : "Total"}
                  </span>
                  <span className="min-w-[120px] text-right tabular-nums">
                    {formatMoney(amountDueNow, tenantSettings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>
        <div
          className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm"
          style={{ borderColor: checkoutBorder }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: checkoutAccent }}
            >
              Customer details
            </p>
            <h2
              className="mt-1 text-xl font-semibold"
              style={{ color: checkoutPrimary }}
            >
              Signed in details and payment
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirm who is ordering, choose the payment method, then complete
              the checkout details below.
            </p>
          </div>
          {checkoutBlockedByTrial ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Checkout is temporarily paused</p>
              <p className="mt-1 leading-6">{checkoutBlockedMessage}</p>
              <a
                href="/"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
              >
                Back to menu
              </a>
            </div>
          ) : null}
          {customerAccountLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-slate-900">
                    Checking saved customer details…
                  </p>
                  <p className="mt-1 text-slate-600">
                    We are looking for your saved profile so checkout can be
                    quicker.
                  </p>
                </div>
              </div>
            </div>
          ) : customerAccount ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    Signed in as{" "}
                    {customerAccount.fullName || customerAccount.email}
                  </p>
                  <p className="mt-1 text-emerald-800">
                    Saved profile details have been prefilled where available,
                    and this order will be linked to your account.
                  </p>
                  {rewardSummary ? (
                    <p className="mt-1 text-xs font-bold text-emerald-900">
                      {rewardSummary.tierLabel} rewards:{" "}
                      {rewardSummary.discountPercent}% off eligible orders.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => applySavedProfileToCheckout()}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Use saved details
                </button>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-emerald-900">
                <input
                  type="checkbox"
                  checked={saveDetailsToAccount}
                  onChange={(event) =>
                    setSaveDetailsToAccount(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-emerald-300"
                />
                <span>
                  Save these checkout details to my account for next time
                </span>
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Guest checkout</p>
              <p className="mt-1 text-slate-600">
                You can still order as a guest, or{" "}
                <a href="/account/login" className="font-semibold underline">
                  sign in
                </a>{" "}
                to link your order to your account and prefill your details next
                time.
              </p>
            </div>
          )}
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div
            className="rounded-2xl border bg-slate-50 p-4"
            style={{ borderColor: checkoutBorder }}
          >
            <p className="text-sm font-semibold text-slate-950">
              Choose payment method
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Choose your payment method after reviewing the order and sign-in
              details. Online providers only appear when the store owner has
              connected their own account.
            </p>
            <div className="mt-3 grid gap-2">
              {paymentOptions.length ? (
                paymentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm transition ${paymentProvider === option.id ? "shadow-sm" : "hover:bg-slate-50"}`}
                    style={{
                      borderColor:
                        paymentProvider === option.id
                          ? checkoutPrimary
                          : checkoutBorder,
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentProvider"
                      value={option.id}
                      checked={paymentProvider === option.id}
                      onChange={() => setPaymentProvider(option.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No payment method is currently available for this order type.
                  Please contact the store.
                </div>
              )}
            </div>
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
              Online payments are store-owned. Stripe, PayFast, Ozow, Yoco,
              direct M-Pesa and M-Pesa/Pesapal only show after the store owner
              has connected the relevant provider.
            </div>
          </div>

          <input
            className="w-full rounded-xl border p-3"
            style={{
              borderColor: checkoutBorder,
              color: checkoutText,
              backgroundColor: "white",
            }}
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            style={{
              borderColor: checkoutBorder,
              color: checkoutText,
              backgroundColor: "white",
            }}
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            style={{
              borderColor: checkoutBorder,
              color: checkoutText,
              backgroundColor: "white",
            }}
            placeholder="Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            disabled={orderType === "collection"}
          />

          <select
            className="w-full rounded-xl border p-3"
            style={{
              borderColor: checkoutBorder,
              color: checkoutText,
              backgroundColor: "white",
            }}
            value={orderType}
            onChange={(e) =>
              setOrderType(e.target.value as "delivery" | "collection")
            }
          >
            <option value="delivery">Delivery</option>
            <option value="collection">Collection</option>
          </select>

          {tenantSettings.discountsEnabled &&
          (visibleDiscounts.length || discountRules.length) ? (
            <div
              className="rounded-2xl border bg-white p-4 shadow-sm"
              style={{ borderColor: checkoutBorder }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Offers & discount codes
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Apply one eligible offer. Some offers can be combined with
                    rewards, others replace the reward discount.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscountsModalOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm font-black text-rose-700"
                  aria-label="View discounts"
                >
                  %
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-xl border p-3 text-sm"
                  style={{
                    borderColor: checkoutBorder,
                    color: checkoutText,
                    backgroundColor: "white",
                  }}
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                />
                <button
                  type="button"
                  onClick={() => setDiscountsModalOpen(true)}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                >
                  View
                </button>
              </div>
              {discountResult.applied ? (
                <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
                  Applied: {discountResult.name}
                  {discountResult.code ? ` (${discountResult.code})` : ""}. You
                  save {formatMoney(discountResult.amount, tenantSettings)}.
                </p>
              ) : discountCode.trim() ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                  This code is not eligible for the current basket.
                </p>
              ) : null}
              {visibleDiscounts.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleDiscounts.slice(0, 4).map(({ rule }) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setDiscountCode(rule.code || "")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-rose-800"
                    >
                      <span aria-hidden="true">%</span>
                      {rule.code || rule.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <textarea
            className="w-full rounded-xl border p-3"
            style={{
              borderColor: checkoutBorder,
              color: checkoutText,
              backgroundColor: "white",
            }}
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            onClick={() => void placeOrder()}
            disabled={
              loading ||
              !cartRows.length ||
              checkoutBlockedByTrial ||
              !selectedPaymentOption
            }
            className="rounded-xl px-5 py-3 text-white disabled:opacity-50"
            style={{ backgroundColor: checkoutPrimary }}
          >
            {checkoutBlockedByTrial
              ? "Checkout paused"
              : loading
                ? selectedPaymentOption?.online
                  ? "Connecting to secure payment..."
                  : "Placing order..."
                : preorderFinancials.hasPreorder &&
                    selectedPaymentOption?.online
                  ? "Pay deposit securely"
                  : preorderFinancials.hasPreorder
                    ? "Confirm pre-order deposit"
                    : selectedPaymentOption?.online
                      ? "Continue to secure payment"
                      : "Confirm order"}
          </button>

          <p className="text-xs leading-5 text-gray-500">
            Your order will be saved first, and the cart will only clear after a
            successful save.
          </p>
        </div>
      </div>

      {showCheckoutSubmitLoading ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 px-[35px] py-[75px] backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-submit-loading-title"
        >
          <div className="w-full max-w-sm rounded-[30px] border border-white/80 bg-white p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,0.34)]">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
              style={{
                background: `linear-gradient(135deg, ${checkoutPrimary}, ${checkoutAccent})`,
              }}
            >
              <span
                className="h-8 w-8 animate-spin rounded-full border-4 border-white/35 border-t-white"
                aria-hidden="true"
              />
            </div>
            <h2
              id="checkout-submit-loading-title"
              className="mt-5 text-2xl font-semibold tracking-tight text-slate-950"
            >
              Processing checkout…
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Please wait while we save your order and connect to the selected
              payment method.
            </p>
          </div>
        </div>
      ) : null}

      {discountsModalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-[35px] py-[75px] backdrop-blur-[3px]"
          onClick={() => setDiscountsModalOpen(false)}
        >
          <div
            className="flex max-h-[calc(100dvh-150px)] w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.38)] sm:max-w-lg lg:max-w-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 overflow-hidden px-5 py-5 text-white sm:px-7 sm:py-6"
              style={{
                background: `linear-gradient(135deg, ${checkoutAccent} 0%, ${checkoutPrimary} 100%)`,
              }}
            >
              <button
                type="button"
                onClick={() => setDiscountsModalOpen(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white ring-1 ring-white/25"
                aria-label="Close discounts"
              >
                ×
              </button>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 text-3xl ring-1 ring-white/30">
                %
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
                Discounts
              </p>
              <h3 className="mt-1 pr-10 text-2xl font-black tracking-tight">
                {tenantSettings.discountPopupTitle || "Available offers"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/88">
                {tenantSettings.discountPopupMessage ||
                  "Choose an eligible discount for this basket."}
              </p>
            </div>
            <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-7 sm:px-7 sm:pb-12">
              <div className="grid gap-3">
                {visibleDiscounts.length ? (
                  visibleDiscounts.map(({ rule, amount }) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => {
                        setDiscountCode(rule.code || "");
                        setDiscountsModalOpen(false);
                      }}
                      className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-left text-sm text-rose-950 transition hover:bg-rose-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">
                            {rule.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-rose-900">
                            {rule.scope === "combo"
                              ? "Combination discount"
                              : rule.scope === "product"
                                ? "Product discount"
                                : "Site-wide discount"}
                            {rule.code
                              ? ` · Code ${rule.code}`
                              : " · automatic"}
                          </p>
                          {rule.allowWithRewards === false ||
                          rule.onlyThisDiscount ? (
                            <p className="mt-1 text-[11px] font-bold text-amber-700">
                              Cannot be combined with rewards.
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] font-bold text-emerald-700">
                              Can be used with rewards.
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-rose-800">
                          Save {formatMoney(amount, tenantSettings)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No discounts currently apply to this basket. Try adding the
                    eligible product or combination.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDiscountsModalOpen(false)}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className="mt-6 rounded-[28px] border bg-white p-5 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6"
        style={{ borderColor: checkoutBorder, color: checkoutText }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: checkoutAccent }}
        >
          Business details
        </p>
        <p
          className="mt-2 text-base font-semibold"
          style={{ color: checkoutPrimary }}
        >
          {tenantSettings.displayName || "Your order"}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {tenantSettings.contactPhone ? (
            <p>Phone: {tenantSettings.contactPhone}</p>
          ) : null}
          {tenantSettings.contactEmail ? (
            <p>Email: {tenantSettings.contactEmail}</p>
          ) : null}
          {tenantSettings.contactWhatsApp ? (
            <p>WhatsApp: {tenantSettings.contactWhatsApp}</p>
          ) : null}
          {tenantSettings.contactAddress ? (
            <p>Address: {tenantSettings.contactAddress}</p>
          ) : null}
        </div>
        <p className="mt-4 leading-6 text-slate-600">
          {tenantSettings.footerBlurb || "Thank you for ordering with us."}
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {tenantSettings.footerNotice ||
            "Prices and availability may change without notice."}
        </p>
      </section>
    </main>
  );
}
