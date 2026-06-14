import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CreateOrderInput } from "@/lib/types";
import { resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { buildWhatsAppAppUrl, buildWhatsAppOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant, sendCustomerPushForOrderWithFallback } from "@/lib/web-push";
import { calculateTenantTrialState, TRIAL_EXPIRY_CUSTOMER_MESSAGE } from "@/lib/trial";
import { getStorefrontPaymentOption } from "@/lib/storefront-payment-options";
import { createTenantStripeOrderCheckoutIntent } from "@/lib/storefront-stripe";
import { createTenantYocoOrderCheckoutIntent } from "@/lib/storefront-yoco";
import { createTenantPesapalOrderCheckoutIntent } from "@/lib/storefront-pesapal";
import { createTenantDarajaStkPushIntent } from "@/lib/storefront-daraja";
import { calculateRewardDiscount, getCustomerRewardSummary } from "@/lib/rewards";
import { calculateBestDiscount } from "@/lib/discounts";
import { calculatePreorderFinancials, isPreorderProduct, moneyRound, normalizePreorderDepositPercent } from "@/lib/preorders";

function hasNumberValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getVariantPrice(basePrice: number, variant: any) {
  const explicitPrice = hasNumberValue(variant?.price) ? Number(variant?.price) : Number.NaN;
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return explicitPrice;
  const legacyDelta = hasNumberValue(variant?.priceDelta) ? Number(variant?.priceDelta) : Number.NaN;
  return Math.max(0, Number(basePrice || 0) + (Number.isFinite(legacyDelta) ? legacyDelta : 0));
}

function getVariantPriceDeltaForStorage(basePrice: number, variant: any, unitPrice: number) {
  // Ver-0.226: variants now use final selling prices. Keep the legacy column only for old
  // +/- variants that do not yet have an explicit final price.
  const explicitPrice = hasNumberValue(variant?.price) ? Number(variant?.price) : Number.NaN;
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return 0;
  return Number((Number(unitPrice || 0) - Number(basePrice || 0)).toFixed(2));
}

function getVariantStockState(product: any, variant: any | null) {
  if (variant) {
    const tracked = variant?.stockEnabled === true;
    const available = Math.max(0, Math.floor(Number(variant?.stockQuantity || 0)));
    return { tracked, available };
  }

  const tracked = Boolean(product?.stock_enabled);
  const available = Math.max(0, Math.floor(Number(product?.stock_quantity || 0)));
  return { tracked, available };
}

function findActiveVariant(product: any, variantId?: string | null) {
  if (!variantId) return null;
  const variants = Array.isArray(product?.product_variants) ? product.product_variants : [];
  return variants.find((variant: any) => variant?.id === variantId && variant?.isActive !== false) || null;
}

function reduceVariantStock(productVariants: any[], variantId: string, quantity: number) {
  return productVariants.map((variant: any) => {
    if (variant?.id !== variantId || variant?.stockEnabled !== true) return variant;
    const currentStock = Math.max(0, Math.floor(Number(variant.stockQuantity || 0)));
    return { ...variant, stockQuantity: Math.max(0, currentStock - quantity) };
  });
}

export async function POST(req: Request) {
  let savedCustomerAccountIdForResponse: string | null = null;
  try {
    const body = (await req.json()) as CreateOrderInput;
    const requestTenantSlug = resolveTenantSlugFromRequest(req);

    if (!requestTenantSlug) {
      return NextResponse.json({ error: "Store could not be resolved from request" }, { status: 400 });
    }

    if (!body.tenantSlug?.trim()) {
      return NextResponse.json({ error: "Missing store address" }, { status: 400 });
    }

    const submittedTenantSlug = body.tenantSlug.trim();
    const submittedTenantId = body.tenantId?.trim() || null;

    if (submittedTenantSlug !== requestTenantSlug) {
      return NextResponse.json(
        { error: "Order store mismatch" },
        { status: 400 }
      );
    }

    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: "Missing customer name" }, { status: 400 });
    }

    if (!body.customerPhone?.trim()) {
      return NextResponse.json({ error: "Missing customer phone" }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No order items provided" }, { status: 400 });
    }

    if (body.items.some((item) => !item.productId || item.quantity < 1)) {
      return NextResponse.json({ error: "Invalid order item payload" }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("*")
      .eq("slug", requestTenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!tenant.whatsapp_number) {
      return NextResponse.json(
        { error: "Store WhatsApp number not configured" },
        { status: 400 }
      );
    }


    const trialState = calculateTenantTrialState(tenant);
    if (trialState.checkoutBlocked) {
      return NextResponse.json(
        { error: TRIAL_EXPIRY_CUSTOMER_MESSAGE, trialExpired: true },
        { status: 402 }
      );
    }

    const productIds = Array.from(new Set(body.items.map((i) => i.productId)));

    const { data: products, error: productsError } = await db
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    if (productsError || !products?.length) {
      return NextResponse.json({ error: "Products not found" }, { status: 400 });
    }

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products do not belong to this store or are inactive" },
        { status: 400 }
      );
    }

    const requestedQuantityBySellableLine = new Map<string, number>();
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId);
      const selectedVariant = item.variantId ? findActiveVariant(product, item.variantId) : null;
      if (isPreorderProduct(product, selectedVariant)) continue;
      const lineKey = `${item.productId}::${item.variantId || "base"}`;
      requestedQuantityBySellableLine.set(lineKey, (requestedQuantityBySellableLine.get(lineKey) || 0) + item.quantity);
    }

    for (const [lineKey, requestedQuantity] of requestedQuantityBySellableLine.entries()) {
      const [productId, variantId] = lineKey.split("::");
      const product = products.find((p) => p.id === productId);
      const isCustomAmountProduct = product?.product_type === "customer_amount" || product?.custom_amount_enabled === true;
      if (isCustomAmountProduct) continue;
      const selectedVariant = variantId !== "base" ? findActiveVariant(product, variantId) : null;

      if (variantId !== "base" && !selectedVariant) {
        return NextResponse.json({ error: "Selected product option is no longer available." }, { status: 409 });
      }

      const stock = getVariantStockState(product, selectedVariant);
      const canPreorder = isPreorderProduct(product, selectedVariant);
      if (!canPreorder && stock.tracked && requestedQuantity > stock.available) {
        const optionName = selectedVariant?.name ? `${product?.name || "This product"} - ${selectedVariant.name}` : product?.name || "This product";
        return NextResponse.json(
          { error: `${optionName} only has ${stock.available} in stock.` },
          { status: 409 }
        );
      }
    }

    const settings = await getTenantSettings(tenant.id);
    const preorderDepositPercent = normalizePreorderDepositPercent((settings as any)?.preorder_deposit_percent ?? 25);

    let subtotal = 0;

    const orderItems = body.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error(`Product missing: ${item.productId}`);
      }

      const isCustomAmountProduct = product.product_type === "customer_amount" || product.custom_amount_enabled === true;
      const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
      const selectedVariant = isCustomAmountProduct ? null : findActiveVariant(product, item.variantId);

      if (!isCustomAmountProduct && product.variants_enabled && variants.some((variant: any) => variant?.isActive !== false) && item.variantId && !selectedVariant) {
        throw new Error(`Variant missing: ${item.variantId}`);
      }

      const variantLabel = selectedVariant ? String(product.variant_label || "Option") : null;
      const variantName = selectedVariant ? String((selectedVariant as any).name || "").trim() : null;
      const basePrice = Number(product.price || 0);
      let unitPrice = selectedVariant ? getVariantPrice(basePrice, selectedVariant) : basePrice;
      let customAmountReference: string | null = null;
      let customAmountNote: string | null = null;
      if (isCustomAmountProduct) {
        const amount = Number((item as any).customAmount);
        const minAmount = Math.max(0, Number(product.custom_amount_min ?? 1));
        const maxAmount = product.custom_amount_max === null || product.custom_amount_max === undefined ? null : Number(product.custom_amount_max);
        const reference = String((item as any).customAmountReference || "").trim();
        if (!Number.isFinite(amount) || amount <= 0 || amount < minAmount) {
          throw new Error(`${product.name} needs a valid payment amount.`);
        }
        if (Number.isFinite(maxAmount as number) && maxAmount !== null && maxAmount > 0 && amount > maxAmount) {
          throw new Error(`${product.name} amount is above the allowed maximum.`);
        }
        if (product.custom_amount_reference_required !== false && !reference) {
          throw new Error(`${product.name} needs a reference or invoice number.`);
        }
        unitPrice = Number(amount.toFixed(2));
        customAmountReference = reference || null;
        customAmountNote = String((item as any).customAmountNote || "").trim() || null;
      }
      const variantPriceDelta = selectedVariant ? getVariantPriceDeltaForStorage(basePrice, selectedVariant, unitPrice) : 0;
      const lineTotal = unitPrice * item.quantity;
      const isLinePreorder = isPreorderProduct(product, selectedVariant);
      subtotal += lineTotal;
      const displayName = isCustomAmountProduct
        ? `${product.name}${customAmountReference ? ` (${String(product.custom_amount_reference_label || "Reference")}: ${customAmountReference})` : ""}`
        : variantName ? `${product.name} (${variantLabel}: ${variantName})` : product.name;

      return {
        product_id: product.id,
        product_name: displayName,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        variant_id: selectedVariant ? String((selectedVariant as any).id) : null,
        variant_label: variantLabel,
        variant_name: variantName,
        variant_price_delta: selectedVariant ? Number(variantPriceDelta.toFixed(2)) : 0,
        customer_entered_amount: isCustomAmountProduct ? unitPrice : null,
        customer_reference: customAmountReference,
        customer_note: customAmountNote,
        is_preorder: isLinePreorder,
        preorder_deposit_amount: 0,
        preorder_balance_amount: 0,
      };
    });

    const customerAccountId = body.customerAccountId?.trim() || null;
    const containsCustomAmountLines = orderItems.some((item: any) => item.customer_entered_amount !== null && item.customer_entered_amount !== undefined);
    const customAmountDisablesRewards = containsCustomAmountLines && products.some((product: any) => (product.product_type === "customer_amount" || product.custom_amount_enabled === true) && product.custom_amount_disable_rewards !== false);
    const customAmountDisablesDiscounts = containsCustomAmountLines && products.some((product: any) => (product.product_type === "customer_amount" || product.custom_amount_enabled === true) && product.custom_amount_disable_discounts !== false);
    const rewardSummary = customAmountDisablesRewards ? { enabled: false, tier: null, discountPercent: 0, qualifyingSpend: 0 } as any : await getCustomerRewardSummary({ tenantId: tenant.id, customerAccountId, settings });
    const initialRewardDiscount = rewardSummary.enabled && customerAccountId ? calculateRewardDiscount(subtotal, rewardSummary.discountPercent) : calculateRewardDiscount(subtotal, 0);
    const discountCalculation = customAmountDisablesDiscounts
      ? { applied: false, rewardAllowed: true, totalAfterDiscount: Math.max(0, Math.round((subtotal - initialRewardDiscount.discountAmount) * 100) / 100) } as any
      : calculateBestDiscount({
          settings,
          cartLines: orderItems.map((item) => ({ productId: item.product_id, quantity: item.quantity, lineTotal: item.line_total })),
          subtotal,
          code: (body as any).discountCode,
          rewardDiscountAmount: initialRewardDiscount.discountAmount,
        });
    const rewardDiscount = discountCalculation.applied && !discountCalculation.rewardAllowed ? calculateRewardDiscount(subtotal, 0) : initialRewardDiscount;
    const totalAfterRewards = Math.max(0, Math.round((subtotal - rewardDiscount.discountAmount) * 100) / 100);
    const total = discountCalculation.applied ? discountCalculation.totalAfterDiscount : totalAfterRewards;
    const preorderSubtotal = orderItems.reduce((sum: number, item: any) => sum + (item.is_preorder ? Number(item.line_total || 0) : 0), 0);
    const preorderFinancials = calculatePreorderFinancials({
      lineSubtotal: total,
      preorderSubtotal: Math.min(preorderSubtotal, total),
      depositPercent: preorderDepositPercent,
    });
    const payableNowTotal = preorderFinancials.hasPreorder ? preorderFinancials.amountDueNow : total;
    const orderItemsForStorage = orderItems.map((item: any) => {
      if (!item.is_preorder || preorderFinancials.preorderSubtotal <= 0) return item;
      const share = Number(item.line_total || 0) / preorderFinancials.preorderSubtotal;
      const deposit = moneyRound(preorderFinancials.depositAmount * share);
      return {
        ...item,
        preorder_deposit_amount: deposit,
        preorder_balance_amount: moneyRound(Number(item.line_total || 0) - deposit),
      };
    });
    const preorderMetadata = preorderFinancials.hasPreorder
      ? {
          order_flow: preorderFinancials.orderFlow,
          preorder_status: "awaiting_stock",
          preorder_deposit_percent: preorderFinancials.depositPercent,
          preorder_deposit_amount: preorderFinancials.depositAmount,
          preorder_balance_amount: preorderFinancials.balanceAmount,
          preorder_balance_payment_status: preorderFinancials.balanceAmount > 0 ? "pending" : "not_applicable",
        }
      : {
          order_flow: "standard",
          preorder_status: null,
          preorder_deposit_percent: null,
          preorder_deposit_amount: 0,
          preorder_balance_amount: 0,
          preorder_balance_payment_status: "not_applicable",
        };
    const rewardMetadata = rewardSummary.enabled && customerAccountId && rewardDiscount.discountAmount > 0
      ? {
          reward_tier: rewardSummary.tier,
          reward_discount_percent: rewardDiscount.discountPercent,
          reward_discount_amount: rewardDiscount.discountAmount,
          subtotal_total: rewardDiscount.subtotal,
          rewards_spend_before: rewardSummary.qualifyingSpend,
          rewards_spend_after: Math.round((rewardSummary.qualifyingSpend + total) * 100) / 100,
        }
      : {
          reward_tier: null,
          reward_discount_percent: 0,
          reward_discount_amount: 0,
          subtotal_total: rewardDiscount.subtotal,
          rewards_spend_before: rewardSummary.enabled && customerAccountId ? rewardSummary.qualifyingSpend : null,
          rewards_spend_after: rewardSummary.enabled && customerAccountId ? Math.round((rewardSummary.qualifyingSpend + total) * 100) / 100 : null,
        };
    const discountMetadata = discountCalculation.applied
      ? {
          discount_rule_id: discountCalculation.ruleId,
          discount_code: discountCalculation.code,
          discount_name: discountCalculation.name,
          discount_scope: discountCalculation.scope,
          discount_type: discountCalculation.type,
          discount_value: discountCalculation.value,
          discount_base_amount: discountCalculation.baseAmount,
          discount_amount: discountCalculation.amount,
          discount_allow_with_rewards: discountCalculation.allowWithRewards,
          discount_only_this_discount: discountCalculation.onlyThisDiscount,
        }
      : {
          discount_rule_id: null,
          discount_code: null,
          discount_name: null,
          discount_scope: null,
          discount_type: null,
          discount_value: 0,
          discount_base_amount: 0,
          discount_amount: 0,
          discount_allow_with_rewards: true,
          discount_only_this_discount: false,
        };
    const selectedPayment = getStorefrontPaymentOption(settings, body.orderType, body.paymentProvider);

    if (!selectedPayment) {
      return NextResponse.json(
        { error: "No payment method is currently available for this order type" },
        { status: 400 }
      );
    }

    if (selectedPayment.online && !["stripe", "yoco", "mpesa", "daraja"].includes(selectedPayment.id)) {
      return NextResponse.json(
        { error: "This online payment provider is not live for this store yet. Please choose another payment option." },
        { status: 400 }
      );
    }

    if (selectedPayment.id === "stripe") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantStripeOrderCheckoutIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItemsForStorage,
          total: payableNowTotal,
          orderTotal: total,
          preorder: preorderFinancials.hasPreorder ? preorderMetadata : null,
          currencyCode: branding.currencyCode || settings?.currency_code || "GBP",
          paymentMethodLabel: selectedPayment.label,
          rewards: rewardMetadata,
          discounts: discountMetadata,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: preorderFinancials.hasPreorder ? "preorder_deposit_checkout_started" : "checkout_started",
          amountDueNow: payableNowTotal,
          preorder: preorderFinancials,
          stripeCheckoutUrl: checkoutIntent.url,
          stripeCheckoutSessionId: checkoutIntent.sessionId,
        });
      } catch (stripeError) {
        const message = stripeError instanceof Error ? stripeError.message : "Stripe checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }


    if (selectedPayment.id === "yoco") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantYocoOrderCheckoutIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItemsForStorage,
          total: payableNowTotal,
          orderTotal: total,
          preorder: preorderFinancials.hasPreorder ? preorderMetadata : null,
          currencyCode: branding.currencyCode || settings?.currency_code || "ZAR",
          paymentMethodLabel: selectedPayment.label,
          rewards: rewardMetadata,
          discounts: discountMetadata,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: preorderFinancials.hasPreorder ? "preorder_deposit_checkout_started" : "checkout_started",
          amountDueNow: payableNowTotal,
          preorder: preorderFinancials,
          yocoCheckoutUrl: checkoutIntent.url,
          yocoCheckoutId: checkoutIntent.yocoCheckoutId,
        });
      } catch (yocoError) {
        const message = yocoError instanceof Error ? yocoError.message : "Yoco checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }



    if (selectedPayment.id === "daraja") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantDarajaStkPushIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItemsForStorage,
          total: payableNowTotal,
          orderTotal: total,
          preorder: preorderFinancials.hasPreorder ? preorderMetadata : null,
          currencyCode: branding.currencyCode || settings?.currency_code || "KES",
          paymentMethodLabel: selectedPayment.label,
          rewards: rewardMetadata,
          discounts: discountMetadata,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: preorderFinancials.hasPreorder ? "preorder_deposit_checkout_started" : "checkout_started",
          amountDueNow: payableNowTotal,
          preorder: preorderFinancials,
          darajaCheckoutUrl: checkoutIntent.url,
          darajaMerchantRequestId: checkoutIntent.merchantRequestId,
          darajaCheckoutRequestId: checkoutIntent.checkoutRequestId,
          darajaAccountReference: checkoutIntent.accountReference,
          customerMessage: checkoutIntent.customerMessage,
        });
      } catch (darajaError) {
        const message = darajaError instanceof Error ? darajaError.message : "Direct M-Pesa checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }



    if (selectedPayment.id === "mpesa") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantPesapalOrderCheckoutIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItemsForStorage,
          total: payableNowTotal,
          orderTotal: total,
          preorder: preorderFinancials.hasPreorder ? preorderMetadata : null,
          currencyCode: branding.currencyCode || settings?.currency_code || "KES",
          paymentMethodLabel: selectedPayment.label,
          rewards: rewardMetadata,
          discounts: discountMetadata,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: preorderFinancials.hasPreorder ? "preorder_deposit_checkout_started" : "checkout_started",
          amountDueNow: payableNowTotal,
          preorder: preorderFinancials,
          mpesaCheckoutUrl: checkoutIntent.url,
          pesapalOrderTrackingId: checkoutIntent.orderTrackingId,
          pesapalMerchantReference: checkoutIntent.merchantReference,
        });
      } catch (mpesaError) {
        const message = mpesaError instanceof Error ? mpesaError.message : "M-Pesa checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        customer_name: body.customerName.trim(),
        customer_phone: body.customerPhone.trim(),
        customer_account_id: customerAccountId,
        customer_address:
          body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
        order_type: body.orderType,
        status: "new",
        total,
        ...preorderMetadata,
        subtotal_total: rewardMetadata.subtotal_total,
        reward_tier: rewardMetadata.reward_tier,
        reward_discount_percent: rewardMetadata.reward_discount_percent,
        reward_discount_amount: rewardMetadata.reward_discount_amount,
        discount_rule_id: discountMetadata.discount_rule_id,
        discount_code: discountMetadata.discount_code,
        discount_name: discountMetadata.discount_name,
        discount_scope: discountMetadata.discount_scope,
        discount_type: discountMetadata.discount_type,
        discount_value: discountMetadata.discount_value,
        discount_base_amount: discountMetadata.discount_base_amount,
        discount_amount: discountMetadata.discount_amount,
        discount_allow_with_rewards: discountMetadata.discount_allow_with_rewards,
        discount_only_this_discount: discountMetadata.discount_only_this_discount,
        rewards_spend_before: rewardMetadata.rewards_spend_before,
        rewards_spend_after: rewardMetadata.rewards_spend_after,
        notes: body.notes?.trim() || null,
        payment_provider: selectedPayment.id,
        payment_method_label: selectedPayment.label,
        payment_status: selectedPayment.online ? "pending_online_payment" : "pay_on_fulfilment",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderItemsWithOrderId = orderItemsForStorage.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await db.from("order_items").insert(orderItemsWithOrderId);

    if (itemsError) {
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    // Ver-0.209: lightweight analytics. Never block order creation if analytics is unavailable.
    db.from("analytics_events").insert({
      tenant_id: tenant.id,
      scope: "tenant_storefront",
      event_type: "order_created",
      host: req.headers.get("x-forwarded-host") || req.headers.get("host") || null,
      page_path: "/checkout",
      order_id: order.id,
      anonymous_session_id: customerAccountId,
      metadata: { orderType: body.orderType, paymentProvider: selectedPayment.id, subtotal, total, rewardTier: rewardMetadata.reward_tier, rewardDiscountAmount: rewardMetadata.reward_discount_amount, discountCode: discountMetadata.discount_code, discountAmount: discountMetadata.discount_amount, orderFlow: preorderMetadata.order_flow, preorderDepositAmount: preorderMetadata.preorder_deposit_amount, preorderBalanceAmount: preorderMetadata.preorder_balance_amount, amountDueNow: payableNowTotal },
    }).then(undefined, () => undefined);

    const quantityBySellableLine = new Map<string, number>();
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId);
      const selectedVariant = item.variantId ? findActiveVariant(product, item.variantId) : null;
      if (isPreorderProduct(product, selectedVariant)) continue;
      const lineKey = `${item.productId}::${item.variantId || "base"}`;
      quantityBySellableLine.set(lineKey, (quantityBySellableLine.get(lineKey) || 0) + item.quantity);
    }

    for (const [lineKey, quantity] of quantityBySellableLine.entries()) {
      const [productId, variantId] = lineKey.split("::");
      const product = products.find((p) => p.id === productId);
      if (!product) continue;
      if (product.product_type === "customer_amount" || product.custom_amount_enabled === true) continue;

      if (variantId !== "base") {
        const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
        const selectedVariant = findActiveVariant(product, variantId);
        if (!selectedVariant?.stockEnabled) continue;

        const nextVariants = reduceVariantStock(variants, variantId, quantity);
        const { error: stockError } = await db
          .from("products")
          .update({ product_variants: nextVariants })
          .eq("id", product.id)
          .eq("tenant_id", tenant.id);

        if (stockError) {
          console.error("Failed to reduce variant stock", stockError);
        }
        continue;
      }

      if (!product.stock_enabled) continue;

      const nextStock = Math.max(0, Number(product.stock_quantity || 0) - quantity);
      const { error: stockError } = await db
        .from("products")
        .update({ stock_quantity: nextStock })
        .eq("id", product.id)
        .eq("tenant_id", tenant.id);

      if (stockError) {
        console.error("Failed to reduce product stock", stockError);
      }
    }

    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

    const message = buildWhatsAppOrderMessage({
      tenantName: branding.displayName,
      order,
      ...branding,
      items: orderItemsForStorage.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
      payment: {
        label: selectedPayment.label,
        status: selectedPayment.online ? "pending" : "pay_on_fulfilment",
        reference: null,
      },
    });

    const whatsappUrl = buildWhatsAppUrl(tenant.whatsapp_number, message);
    const whatsappAppUrl = buildWhatsAppAppUrl(tenant.whatsapp_number, message);

    await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

    const stripeCheckoutUrl: string | null = null;
    const stripeCheckoutSessionId: string | null = null;

    await Promise.allSettled([
      enqueueNotificationEvent({
        tenantId: tenant.id,
        orderId: order.id,
        audience: "admin",
        eventType: "new_order",
        title: "New order received",
        body: preorderFinancials.hasPreorder ? `${body.customerName.trim()} placed a pre-order. Deposit due now: ${payableNowTotal}.` : selectedPayment.online ? `${body.customerName.trim()} started an online payment for a ${body.orderType} order.` : `${body.customerName.trim()} placed a new ${body.orderType} order.`,
        payload: { orderId: order.id, route: "/admin/orders" },
      }),
      enqueueNotificationEvent({
        tenantId: tenant.id,
        orderId: order.id,
        audience: "customer",
        eventType: "order_received",
        title: "Order received",
        body: preorderFinancials.hasPreorder ? "Your pre-order has been received. Your balance will be requested when stock arrives." : selectedPayment.online ? "Your order has been received and is waiting for secure payment." : "Your order has been received and is waiting for confirmation.",
        payload: { orderId: order.id, status: "new" },
      }),
      sendCustomerPushForOrderWithFallback(tenant.id, order.id, {
        title: "Order received",
        body: preorderFinancials.hasPreorder ? "Your pre-order has been received. Your balance will be requested when stock arrives." : selectedPayment.online ? "Your order has been received and is waiting for secure payment." : "Your order has been received and is waiting for confirmation.",
        url: "/account",
        tag: `orduva-customer-${order.id}-received`,
      }),
      sendAdminPushForTenant(tenant.id, {
        title: "New order received",
        body: preorderFinancials.hasPreorder ? `${body.customerName.trim()} placed a pre-order. Deposit due now: ${payableNowTotal}.` : selectedPayment.online ? `${body.customerName.trim()} started an online payment for a ${body.orderType} order.` : `${body.customerName.trim()} placed a new ${body.orderType} order.`,
        url: "/admin/orders",
        tag: `orduva-order-${order.id}`,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      customerAccountId,
      paymentProvider: selectedPayment.id,
      paymentMethodLabel: selectedPayment.label,
      paymentStatus: preorderFinancials.hasPreorder ? "preorder_deposit" : selectedPayment.online ? "pending_online_payment" : "pay_on_fulfilment",
      total,
      amountDueNow: payableNowTotal,
      preorder: preorderFinancials,
      reward: rewardMetadata,
      discount: discountMetadata,
      stripeCheckoutUrl,
      stripeCheckoutSessionId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
