import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";
import {
  normalizeBoolean,
  normalizeColor,
  normalizeCurrencyCode,
  normalizeCurrencyDecimalPlaces,
  normalizeCurrencyDisplayMode,
  normalizeCurrencySymbolPosition,
  normalizeOptionalText,
  normalizeSeparator,
} from "@/lib/tenant-settings";
import { normalizeStorefrontTheme } from "@/lib/storefront-theme";

const SETTINGS_SELECT = "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, favicon_url, primary_color, accent_color, background_tint, border_color, text_color, storefront_theme_json, contact_phone, contact_email, contact_whatsapp, contact_address, footer_blurb, footer_notice, show_orduva_referral_ad, social_facebook_url, social_instagram_url, social_tiktok_url, social_x_url, social_website_url, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix, enable_cash_on_collection, enable_cash_on_delivery, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_payment_mode, stripe_customer_publishable_key, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_setup_notes, stripe_customer_payments_live, stripe_customer_secret_key, stripe_customer_webhook_secret, enable_yoco_customer_payments, yoco_connection_status, yoco_customer_mode, yoco_customer_account_label, yoco_customer_setup_notes, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_payments_live, yoco_customer_secret_key, yoco_customer_webhook_secret, enable_mpesa_customer_payments, mpesa_connection_status, mpesa_customer_mode, mpesa_customer_consumer_key, mpesa_customer_consumer_secret, mpesa_customer_ipn_id, mpesa_customer_account_label, mpesa_customer_setup_notes, mpesa_customer_payments_live";

function secretHint(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.length <= 6 ? "saved" : `••••${text.slice(-4)}`;
}

function normalizeStripePaymentMode(value: unknown) {
  const mode = String(value || "manual_keys").trim().toLowerCase();
  return mode === "stripe_connect" ? "stripe_connect" : "manual_keys";
}

function normalizeLongSecret(value: unknown, maxLength = 800) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function normalizeStripeConnectionStatus(value: unknown) {
  const status = String(value || "not_configured").trim().toLowerCase();
  return ["not_configured", "configured", "connected", "active", "disabled"].includes(status) ? status : "not_configured";
}

function normalizeYocoMode(value: unknown) {
  const mode = String(value || "test").trim().toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeYocoConnectionStatus(value: unknown) {
  const status = String(value || "not_configured").trim().toLowerCase();
  return ["not_configured", "configured", "connected", "active", "disabled"].includes(status) ? status : "not_configured";
}

function normalizeMpesaMode(value: unknown) {
  const mode = String(value || "test").trim().toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeMpesaConnectionStatus(value: unknown) {
  const status = String(value || "not_configured").trim().toLowerCase();
  return ["not_configured", "configured", "connected", "active", "disabled"].includes(status) ? status : "not_configured";
}


export async function GET(req: Request) {
  const tenantLookup = await resolveAdminTenant(req);
  if (!tenantLookup.ok) return tenantLookup.error;

  const { data, error } = await db
    .from("tenant_settings")
    .select(SETTINGS_SELECT)
    .eq("tenant_id", tenantLookup.tenant.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load tenant settings" }, { status: 500 });
  }


  const sensitive = data as Record<string, unknown> | null;
  return NextResponse.json({
    settings: data
      ? {
          ...Object.fromEntries(Object.entries(data as Record<string, unknown>).filter(([key]) => !["stripe_customer_secret_key", "stripe_customer_webhook_secret", "yoco_customer_secret_key", "yoco_customer_webhook_secret", "mpesa_customer_consumer_secret"].includes(key))),
          stripe_customer_secret_key_set: Boolean(sensitive?.stripe_customer_secret_key),
          stripe_customer_secret_key_hint: secretHint(sensitive?.stripe_customer_secret_key),
          stripe_customer_webhook_secret_set: Boolean(sensitive?.stripe_customer_webhook_secret),
          stripe_customer_webhook_secret_hint: secretHint(sensitive?.stripe_customer_webhook_secret),
          yoco_customer_secret_key_set: Boolean(sensitive?.yoco_customer_secret_key),
          yoco_customer_secret_key_hint: secretHint(sensitive?.yoco_customer_secret_key),
          yoco_customer_webhook_secret_set: Boolean(sensitive?.yoco_customer_webhook_secret),
          yoco_customer_webhook_secret_hint: secretHint(sensitive?.yoco_customer_webhook_secret),
          mpesa_customer_consumer_secret_set: Boolean(sensitive?.mpesa_customer_consumer_secret),
          mpesa_customer_consumer_secret_hint: secretHint(sensitive?.mpesa_customer_consumer_secret),
        }
      : null,
  });
}

export async function PATCH(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;

    const body = await req.json();

    const { data: existingSettings } = await db
      .from("tenant_settings")
      .select("stripe_customer_secret_key, stripe_customer_webhook_secret, stripe_customer_payments_live, yoco_customer_mode, yoco_customer_secret_key, yoco_customer_webhook_secret, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_payments_live, mpesa_customer_consumer_secret")
      .eq("tenant_id", tenantLookup.tenant.id)
      .maybeSingle();

    const stripePublishableKey = normalizeOptionalText(body?.stripeCustomerPublishableKey, 260);
    const stripeSecretKeyInput = normalizeLongSecret(body?.stripeCustomerSecretKeyInput);
    const stripeWebhookSecretInput = normalizeLongSecret(body?.stripeCustomerWebhookSecretInput);
    const hasStripeSecretKey = Boolean(stripeSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_secret_key);
    const hasStripeWebhookSecret = Boolean(stripeWebhookSecretInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_webhook_secret);
    const requestedStripeCustomerPayments = normalizeBoolean(body?.enableStripeCustomerPayments) ?? false;
    const stripeCredentialsReady = Boolean(stripePublishableKey && hasStripeSecretKey && hasStripeWebhookSecret);
    const requestedStripeStatus = normalizeStripeConnectionStatus(body?.stripeConnectionStatus);
    const nextStripeStatus = stripeCredentialsReady ? (requestedStripeStatus === "not_configured" ? "configured" : requestedStripeStatus) : "not_configured";

    if (requestedStripeCustomerPayments && !stripeCredentialsReady) {
      return NextResponse.json(
        { error: "Add this tenant's Stripe publishable key, secret key and webhook secret before enabling Stripe for storefront customers." },
        { status: 400 },
      );
    }

    const yocoSecretKeyInput = normalizeLongSecret(body?.yocoCustomerSecretKeyInput);
    const yocoWebhookSecretInput = normalizeLongSecret(body?.yocoCustomerWebhookSecretInput);
    const nextYocoMode = normalizeYocoMode(body?.yocoCustomerMode);
    const existingYocoMode = normalizeYocoMode((existingSettings as Record<string, unknown> | null)?.yoco_customer_mode);
    const yocoModeChanged = Boolean((existingSettings as Record<string, unknown> | null)?.yoco_customer_mode) && existingYocoMode !== nextYocoMode;
    const yocoSecretChanged = Boolean(yocoSecretKeyInput);
    const shouldResetYocoWebhook = (yocoModeChanged || yocoSecretChanged) && !yocoWebhookSecretInput;
    const hasExistingYocoWebhookSecret = Boolean((existingSettings as Record<string, unknown> | null)?.yoco_customer_webhook_secret) && !shouldResetYocoWebhook;
    const hasYocoSecretKey = Boolean(yocoSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.yoco_customer_secret_key);
    const hasYocoWebhookSecret = Boolean(yocoWebhookSecretInput || hasExistingYocoWebhookSecret);
    const requestedYocoCustomerPayments = normalizeBoolean(body?.enableYocoCustomerPayments) ?? false;
    const yocoCurrencyAllowed = normalizeCurrencyCode(body?.currencyCode) === "ZAR";
    const yocoCredentialsReady = Boolean(hasYocoSecretKey);
    const requestedYocoPaymentsLive = normalizeBoolean(body?.yocoCustomerPaymentsLive) ?? false;
    const requestedYocoStatus = normalizeYocoConnectionStatus(body?.yocoConnectionStatus);
    const nextYocoStatus = yocoCredentialsReady ? (requestedYocoStatus === "not_configured" ? "configured" : requestedYocoStatus) : "not_configured";

    if (requestedYocoCustomerPayments && !yocoCurrencyAllowed) {
      return NextResponse.json(
        { error: "Yoco is currently only enabled for ZAR stores. Change this tenant's currency to ZAR before enabling Yoco." },
        { status: 400 },
      );
    }

    if (requestedYocoCustomerPayments && !yocoCredentialsReady) {
      return NextResponse.json(
        { error: "Add this tenant's Yoco secret key before enabling Yoco setup for storefront customers." },
        { status: 400 },
      );
    }


    const mpesaConsumerKey = normalizeOptionalText(body?.mpesaCustomerConsumerKey, 260);
    const mpesaConsumerSecretInput = normalizeLongSecret(body?.mpesaCustomerConsumerSecretInput);
    const nextMpesaMode = normalizeMpesaMode(body?.mpesaCustomerMode);
    const mpesaIpnId = normalizeOptionalText(body?.mpesaCustomerIpnId, 120);
    const hasMpesaConsumerSecret = Boolean(mpesaConsumerSecretInput || (existingSettings as Record<string, unknown> | null)?.mpesa_customer_consumer_secret);
    const requestedMpesaCustomerPayments = normalizeBoolean(body?.enableMpesaCustomerPayments) ?? false;
    const mpesaCurrencyAllowed = normalizeCurrencyCode(body?.currencyCode) === "KES";
    const mpesaCredentialsReady = Boolean(mpesaConsumerKey && hasMpesaConsumerSecret && mpesaIpnId);
    const requestedMpesaPaymentsLive = normalizeBoolean(body?.mpesaCustomerPaymentsLive) ?? false;
    const requestedMpesaStatus = normalizeMpesaConnectionStatus(body?.mpesaConnectionStatus);
    const nextMpesaStatus = mpesaCredentialsReady ? (requestedMpesaStatus === "not_configured" ? "configured" : requestedMpesaStatus) : "not_configured";

    if (requestedMpesaCustomerPayments && !mpesaCurrencyAllowed) {
      return NextResponse.json(
        { error: "M-Pesa via Pesapal is currently only enabled for KES stores. Change this tenant's currency to KES before enabling M-Pesa." },
        { status: 400 },
      );
    }

    if (requestedMpesaCustomerPayments && !mpesaCredentialsReady) {
      return NextResponse.json(
        { error: "Add this tenant's Pesapal consumer key, consumer secret and IPN notification ID before enabling M-Pesa for storefront customers." },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      tenant_id: tenantLookup.tenant.id,
      business_display_name: normalizeOptionalText(body?.businessDisplayName, 120),
      storefront_heading: normalizeOptionalText(body?.storefrontHeading, 160),
      storefront_subheading: normalizeOptionalText(body?.storefrontSubheading, 400),
      admin_heading_label: normalizeOptionalText(body?.adminHeadingLabel, 120),
      logo_url: normalizeOptionalText(body?.logoUrl, 500),
      favicon_url: normalizeOptionalText(body?.faviconUrl, 500),
      primary_color: normalizeColor(body?.primaryColor),
      accent_color: normalizeColor(body?.accentColor),
      background_tint: normalizeColor(body?.backgroundTint),
      border_color: normalizeColor(body?.borderColor),
      text_color: normalizeColor(body?.textColor),
      storefront_theme_json: normalizeStorefrontTheme(body?.storefrontTheme),
      contact_phone: normalizeOptionalText(body?.contactPhone, 80),
      contact_email: normalizeOptionalText(body?.contactEmail, 160),
      contact_whatsapp: normalizeOptionalText(body?.contactWhatsApp, 80),
      contact_address: normalizeOptionalText(body?.contactAddress, 240),
      footer_blurb: normalizeOptionalText(body?.footerBlurb, 240),
      footer_notice: normalizeOptionalText(body?.footerNotice, 240),
      show_orduva_referral_ad: normalizeBoolean(body?.showOrduvaReferralAd) ?? true,
      social_facebook_url: normalizeOptionalText(body?.socialFacebookUrl, 500),
      social_instagram_url: normalizeOptionalText(body?.socialInstagramUrl, 500),
      social_tiktok_url: normalizeOptionalText(body?.socialTikTokUrl, 500),
      social_x_url: normalizeOptionalText(body?.socialXUrl, 500),
      social_website_url: normalizeOptionalText(body?.socialWebsiteUrl, 500),
      currency_name: normalizeOptionalText(body?.currencyName, 80),
      currency_code: normalizeCurrencyCode(body?.currencyCode),
      currency_symbol: normalizeOptionalText(body?.currencySymbol, 12),
      currency_display_mode: normalizeCurrencyDisplayMode(body?.currencyDisplayMode),
      currency_symbol_position: normalizeCurrencySymbolPosition(body?.currencySymbolPosition),
      currency_decimal_places: normalizeCurrencyDecimalPlaces(body?.currencyDecimalPlaces),
      currency_use_thousands_separator: normalizeBoolean(body?.currencyUseThousandsSeparator),
      currency_decimal_separator: normalizeSeparator(body?.currencyDecimalSeparator),
      currency_thousands_separator: normalizeSeparator(body?.currencyThousandsSeparator),
      currency_suffix: normalizeOptionalText(body?.currencySuffix, 12),
      enable_cash_on_collection: normalizeBoolean(body?.enableCashOnCollection) ?? true,
      enable_cash_on_delivery: normalizeBoolean(body?.enableCashOnDelivery) ?? true,
      enable_stripe_customer_payments: requestedStripeCustomerPayments && stripeCredentialsReady,
      stripe_connection_status: nextStripeStatus,
      stripe_customer_payment_mode: normalizeStripePaymentMode(body?.stripeCustomerPaymentMode),
      stripe_customer_publishable_key: stripePublishableKey,
      stripe_customer_account_label: normalizeOptionalText(body?.stripeCustomerAccountLabel, 120),
      stripe_customer_test_mode: normalizeBoolean(body?.stripeCustomerTestMode) ?? true,
      stripe_customer_setup_notes: normalizeOptionalText(body?.stripeCustomerSetupNotes, 500),
      stripe_customer_payments_live: requestedStripeCustomerPayments && stripeCredentialsReady,
      enable_yoco_customer_payments: requestedYocoCustomerPayments && yocoCurrencyAllowed && yocoCredentialsReady,
      yoco_connection_status: nextYocoStatus,
      yoco_customer_mode: nextYocoMode,
      yoco_customer_account_label: normalizeOptionalText(body?.yocoCustomerAccountLabel, 120),
      yoco_customer_setup_notes: normalizeOptionalText(body?.yocoCustomerSetupNotes, 500),
      yoco_customer_payments_live: requestedYocoCustomerPayments && requestedYocoPaymentsLive && yocoCurrencyAllowed && yocoCredentialsReady && (nextYocoMode !== "live" || hasYocoWebhookSecret),
      enable_mpesa_customer_payments: requestedMpesaCustomerPayments && mpesaCurrencyAllowed && mpesaCredentialsReady,
      mpesa_connection_status: nextMpesaStatus,
      mpesa_customer_mode: nextMpesaMode,
      mpesa_customer_consumer_key: mpesaConsumerKey,
      mpesa_customer_ipn_id: mpesaIpnId,
      mpesa_customer_account_label: normalizeOptionalText(body?.mpesaCustomerAccountLabel, 120),
      mpesa_customer_setup_notes: normalizeOptionalText(body?.mpesaCustomerSetupNotes, 500),
      mpesa_customer_payments_live: requestedMpesaCustomerPayments && requestedMpesaPaymentsLive && mpesaCurrencyAllowed && mpesaCredentialsReady,
    };

    if (stripeSecretKeyInput) payload.stripe_customer_secret_key = stripeSecretKeyInput;
    if (stripeWebhookSecretInput) payload.stripe_customer_webhook_secret = stripeWebhookSecretInput;
    if (yocoSecretKeyInput) payload.yoco_customer_secret_key = yocoSecretKeyInput;
    if (yocoWebhookSecretInput) payload.yoco_customer_webhook_secret = yocoWebhookSecretInput;
    if (mpesaConsumerSecretInput) payload.mpesa_customer_consumer_secret = mpesaConsumerSecretInput;
    if (shouldResetYocoWebhook) {
      payload.yoco_customer_webhook_secret = null;
      payload.yoco_customer_webhook_id = null;
      payload.yoco_customer_webhook_url = null;
    }

    const { data, error } = await db
      .from("tenant_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select(SETTINGS_SELECT)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to save tenant settings" }, { status: 500 });
    }

    const safeData = Object.fromEntries(Object.entries(data as Record<string, unknown>).filter(([key]) => !["stripe_customer_secret_key", "stripe_customer_webhook_secret", "yoco_customer_secret_key", "yoco_customer_webhook_secret", "mpesa_customer_consumer_secret"].includes(key)));
    return NextResponse.json({
      settings: {
        ...safeData,
        stripe_customer_secret_key_set: Boolean(stripeSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_secret_key),
        stripe_customer_secret_key_hint: secretHint(stripeSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_secret_key),
        stripe_customer_webhook_secret_set: Boolean(stripeWebhookSecretInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_webhook_secret),
        stripe_customer_webhook_secret_hint: secretHint(stripeWebhookSecretInput || (existingSettings as Record<string, unknown> | null)?.stripe_customer_webhook_secret),
        yoco_customer_secret_key_set: Boolean(yocoSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.yoco_customer_secret_key),
        yoco_customer_secret_key_hint: secretHint(yocoSecretKeyInput || (existingSettings as Record<string, unknown> | null)?.yoco_customer_secret_key),
        yoco_customer_webhook_secret_set: Boolean(yocoWebhookSecretInput || hasExistingYocoWebhookSecret),
        yoco_customer_webhook_secret_hint: secretHint(yocoWebhookSecretInput || (hasExistingYocoWebhookSecret ? (existingSettings as Record<string, unknown> | null)?.yoco_customer_webhook_secret : null)),
        mpesa_customer_consumer_secret_set: Boolean(mpesaConsumerSecretInput || (existingSettings as Record<string, unknown> | null)?.mpesa_customer_consumer_secret),
        mpesa_customer_consumer_secret_hint: secretHint(mpesaConsumerSecretInput || (existingSettings as Record<string, unknown> | null)?.mpesa_customer_consumer_secret),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save tenant settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
