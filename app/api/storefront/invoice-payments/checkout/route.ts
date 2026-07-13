import { NextResponse } from "next/server";
import { resolveTenantSlugFromRequestAsync } from "@/lib/tenant-server";
import { db } from "@/lib/db";
import { getTenantSettings, buildTenantBranding } from "@/lib/tenant-settings";
import { buildStorefrontPaymentOptions } from "@/lib/storefront-payment-options";
import { createTenantStripeOrderCheckoutIntent } from "@/lib/storefront-stripe";
import { createTenantYocoOrderCheckoutIntent } from "@/lib/storefront-yoco";
import { createTenantPesapalOrderCheckoutIntent } from "@/lib/storefront-pesapal";
import { createTenantDarajaStkPushIntent } from "@/lib/storefront-daraja";
import {
  calculateTenantTrialState,
  TRIAL_EXPIRY_CUSTOMER_MESSAGE,
} from "@/lib/trial";

type PaymentType = "invoice" | "deposit" | "statement_balance";

const PAYMENT_CARDS: Record<
  PaymentType,
  { title: string; referenceLabel: string; amountLabel: string }
> = {
  invoice: {
    title: "Pay Your Invoice",
    referenceLabel: "Invoice number",
    amountLabel: "Amount to pay",
  },
  deposit: {
    title: "Pay a Deposit",
    referenceLabel: "Deposit reference",
    amountLabel: "Deposit amount",
  },
  statement_balance: {
    title: "Pay Statement Balance",
    referenceLabel: "Statement or account reference",
    amountLabel: "Amount to pay",
  },
};

function normalisePaymentType(value: unknown): PaymentType | null {
  const type = String(value || "").trim() as PaymentType;
  return type === "invoice" ||
    type === "deposit" ||
    type === "statement_balance"
    ? type
    : null;
}

function zeroRewards(total: number) {
  return {
    reward_tier: null,
    reward_discount_percent: 0,
    reward_discount_amount: 0,
    subtotal_total: total,
    rewards_spend_before: null,
    rewards_spend_after: null,
  };
}

function zeroDiscounts() {
  return {
    discount_rule_id: null,
    discount_code: null,
    discount_name: null,
    discount_scope: null,
    discount_type: null,
    discount_value: 0,
    discount_base_amount: 0,
    discount_amount: 0,
    discount_allow_with_rewards: false,
    discount_only_this_discount: true,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestTenantSlug = await resolveTenantSlugFromRequestAsync(req);
    if (!requestTenantSlug)
      return NextResponse.json(
        { error: "Tenant could not be resolved from request" },
        { status: 400 },
      );

    const submittedTenantSlug = String(body?.tenantSlug || "").trim();
    if (submittedTenantSlug && submittedTenantSlug !== requestTenantSlug) {
      return NextResponse.json(
        { error: "Payment tenant mismatch" },
        { status: 400 },
      );
    }

    const paymentType = normalisePaymentType(body?.paymentType);
    if (!paymentType)
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 },
      );

    const customerName = String(body?.customerName || "").trim();
    const customerPhone = String(body?.customerPhone || "").trim();
    const reference = String(body?.reference || "").trim();
    const note = String(body?.note || "").trim() || null;
    const amount = Number(body?.amount);

    if (!customerName)
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 },
      );
    if (!customerPhone)
      return NextResponse.json(
        { error: "Please enter your phone number." },
        { status: 400 },
      );
    if (!reference)
      return NextResponse.json(
        { error: "Please enter the payment reference." },
        { status: 400 },
      );
    if (!Number.isFinite(amount) || amount <= 0)
      return NextResponse.json(
        { error: "Please enter a valid payment amount." },
        { status: 400 },
      );

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("*")
      .eq("slug", requestTenantSlug)
      .single();
    if (tenantError || !tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const trialState = calculateTenantTrialState(tenant);
    if (trialState.checkoutBlocked) {
      return NextResponse.json(
        { error: TRIAL_EXPIRY_CUSTOMER_MESSAGE, trialExpired: true },
        { status: 402 },
      );
    }

    const settings = await getTenantSettings(tenant.id);
    if (settings?.invoice_payments_enabled !== true) {
      return NextResponse.json(
        { error: "Invoice payments are not enabled for this store." },
        { status: 400 },
      );
    }
    if (
      paymentType === "invoice" &&
      settings.invoice_payments_invoice_enabled === false
    )
      return NextResponse.json(
        { error: "Invoice payments are not available." },
        { status: 400 },
      );
    if (
      paymentType === "deposit" &&
      settings.invoice_payments_deposit_enabled === false
    )
      return NextResponse.json(
        { error: "Deposit payments are not available." },
        { status: 400 },
      );
    if (
      paymentType === "statement_balance" &&
      settings.invoice_payments_balance_enabled === false
    )
      return NextResponse.json(
        { error: "Statement balance payments are not available." },
        { status: 400 },
      );

    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
    const currencyCode =
      branding.currencyCode || settings?.currency_code || "GBP";
    const card = PAYMENT_CARDS[paymentType];
    const total = Number(amount.toFixed(2));
    const paymentOptions = buildStorefrontPaymentOptions(
      settings,
      "collection",
    ).filter((option) => option.online);
    const selectedPayment = paymentOptions[0] || null;
    if (!selectedPayment)
      return NextResponse.json(
        {
          error:
            "No online payment method is currently available for this store.",
        },
        { status: 400 },
      );

    const items = [
      {
        product_id: null,
        product_name: `${card.title} (${card.referenceLabel}: ${reference})`,
        unit_price: total,
        quantity: 1,
        line_total: total,
        variant_id: null,
        variant_label: null,
        variant_name: null,
        variant_price_delta: 0,
        customer_entered_amount: total,
        customer_reference: reference,
        customer_note: note,
      },
    ];

    const commonInput = {
      req,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: branding.displayName,
      customerName,
      customerPhone,
      customerAccountId: null,
      customerAddress: null,
      orderType: "collection" as const,
      notes: note || `${card.title}: ${reference}`,
      items,
      total,
      currencyCode,
      paymentMethodLabel: selectedPayment.label,
      rewards: zeroRewards(total),
      discounts: zeroDiscounts(),
    };

    if (selectedPayment.id === "stripe") {
      const checkoutIntent =
        await createTenantStripeOrderCheckoutIntent(commonInput);
      return NextResponse.json({
        ok: true,
        paymentProvider: "stripe",
        checkoutId: checkoutIntent.checkoutId,
        stripeCheckoutUrl: checkoutIntent.url,
        stripeCheckoutSessionId: checkoutIntent.sessionId,
      });
    }
    if (selectedPayment.id === "yoco") {
      const checkoutIntent =
        await createTenantYocoOrderCheckoutIntent(commonInput);
      return NextResponse.json({
        ok: true,
        paymentProvider: "yoco",
        checkoutId: checkoutIntent.checkoutId,
        yocoCheckoutUrl: checkoutIntent.url,
        yocoCheckoutId: checkoutIntent.yocoCheckoutId,
      });
    }
    if (selectedPayment.id === "daraja") {
      const checkoutIntent = await createTenantDarajaStkPushIntent(commonInput);
      return NextResponse.json({
        ok: true,
        paymentProvider: "daraja",
        checkoutId: checkoutIntent.checkoutId,
        darajaCheckoutUrl: checkoutIntent.url,
        darajaMerchantRequestId: checkoutIntent.merchantRequestId,
        darajaCheckoutRequestId: checkoutIntent.checkoutRequestId,
        darajaAccountReference: checkoutIntent.accountReference,
        customerMessage: checkoutIntent.customerMessage,
      });
    }
    if (selectedPayment.id === "mpesa") {
      const checkoutIntent =
        await createTenantPesapalOrderCheckoutIntent(commonInput);
      return NextResponse.json({
        ok: true,
        paymentProvider: "mpesa",
        checkoutId: checkoutIntent.checkoutId,
        mpesaCheckoutUrl: checkoutIntent.url,
        pesapalOrderTrackingId: checkoutIntent.orderTrackingId,
        pesapalMerchantReference: checkoutIntent.merchantReference,
      });
    }

    return NextResponse.json(
      { error: "No supported online payment method is available." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment could not be started.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
