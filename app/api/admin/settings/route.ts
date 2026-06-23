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
import { serializeDiscountRules } from "@/lib/discounts";

const SETTINGS_SELECT =
  "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, favicon_url, primary_color, accent_color, background_tint, border_color, text_color, storefront_theme_json, contact_phone, contact_email, contact_whatsapp, contact_address, privacy_policy_title, privacy_policy_body, privacy_policy_show_on_storefront, terms_of_service_title, terms_of_service_body, terms_of_service_show_on_storefront, footer_blurb, footer_notice, show_orduva_referral_ad, social_facebook_url, social_instagram_url, social_tiktok_url, social_x_url, social_website_url, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix, enable_cash_on_collection, enable_cash_on_delivery, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_payment_mode, stripe_customer_publishable_key, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_setup_notes, stripe_customer_payments_live, stripe_customer_secret_key, stripe_customer_webhook_secret, enable_yoco_customer_payments, yoco_connection_status, yoco_customer_mode, yoco_customer_account_label, yoco_customer_setup_notes, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_payments_live, yoco_customer_secret_key, yoco_customer_webhook_secret, enable_ozow_customer_payments, ozow_connection_status, ozow_customer_mode, ozow_site_code, ozow_account_label, ozow_setup_notes, ozow_payments_live, ozow_private_key, ozow_api_key, enable_mpesa_customer_payments, mpesa_connection_status, mpesa_customer_mode, mpesa_customer_consumer_key, mpesa_customer_consumer_secret, mpesa_customer_ipn_id, mpesa_customer_account_label, mpesa_customer_setup_notes, mpesa_customer_payments_live, enable_daraja_customer_payments, daraja_connection_status, daraja_customer_mode, daraja_consumer_key, daraja_consumer_secret, daraja_shortcode, daraja_passkey, daraja_transaction_type, daraja_account_reference_prefix, daraja_callback_url, daraja_account_label, daraja_setup_notes, daraja_payments_live, rewards_enabled, rewards_program_name, rewards_silver_min_spend, rewards_silver_discount_percent, rewards_gold_min_spend, rewards_gold_discount_percent, rewards_platinum_min_spend, rewards_platinum_discount_percent, discounts_enabled, discount_popup_enabled, discount_popup_title, discount_popup_message, discount_rules, receipt_document_name, receipt_tax_label, receipt_tax_number, receipt_tax_rate_percent, receipt_extra_field_1_enabled, receipt_extra_field_1_label, receipt_extra_field_1_value, receipt_extra_field_2_enabled, receipt_extra_field_2_label, receipt_extra_field_2_value, receipt_footer_message, receipt_brand_image_mode, seo_page_name, seo_meta_description, seo_keywords, seo_canonical_url, seo_structured_data_enabled, google_tracking_id, google_tag_manager_id, invoice_payments_enabled, invoice_payments_section_title, invoice_payments_intro_text, invoice_payments_invoice_enabled, invoice_payments_deposit_enabled, invoice_payments_balance_enabled";

function secretHint(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.length <= 6 ? "saved" : `••••${text.slice(-4)}`;
}

function normalizeStripePaymentMode(value: unknown) {
  const mode = String(value || "manual_keys")
    .trim()
    .toLowerCase();
  return mode === "stripe_connect" ? "stripe_connect" : "manual_keys";
}

function normalizeLongSecret(value: unknown, maxLength = 800) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function normalizeStripeConnectionStatus(value: unknown) {
  const status = String(value || "not_configured")
    .trim()
    .toLowerCase();
  return [
    "not_configured",
    "configured",
    "connected",
    "active",
    "disabled",
  ].includes(status)
    ? status
    : "not_configured";
}

function normalizeYocoMode(value: unknown) {
  const mode = String(value || "test")
    .trim()
    .toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeYocoConnectionStatus(value: unknown) {
  const status = String(value || "not_configured")
    .trim()
    .toLowerCase();
  return [
    "not_configured",
    "configured",
    "connected",
    "active",
    "disabled",
  ].includes(status)
    ? status
    : "not_configured";
}

function normalizeOzowMode(value: unknown) {
  const mode = String(value || "test")
    .trim()
    .toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeOzowConnectionStatus(value: unknown) {
  const status = String(value || "not_configured")
    .trim()
    .toLowerCase();
  return [
    "not_configured",
    "configured",
    "connected",
    "active",
    "disabled",
  ].includes(status)
    ? status
    : "not_configured";
}

function normalizeMpesaMode(value: unknown) {
  const mode = String(value || "test")
    .trim()
    .toLowerCase();
  return mode === "live" ? "live" : "test";
}

function normalizeMpesaConnectionStatus(value: unknown) {
  const status = String(value || "not_configured")
    .trim()
    .toLowerCase();
  return [
    "not_configured",
    "configured",
    "connected",
    "active",
    "disabled",
  ].includes(status)
    ? status
    : "not_configured";
}

function normalizeDarajaMode(value: unknown) {
  const mode = String(value || "sandbox")
    .trim()
    .toLowerCase();
  return mode === "live" ? "live" : "sandbox";
}

function normalizeDarajaConnectionStatus(value: unknown) {
  const status = String(value || "not_configured")
    .trim()
    .toLowerCase();
  return [
    "not_configured",
    "configured",
    "connected",
    "active",
    "disabled",
  ].includes(status)
    ? status
    : "not_configured";
}

function normalizeDarajaTransactionType(value: unknown) {
  const txType = String(value || "CustomerPayBillOnline").trim();
  return txType === "CustomerBuyGoodsOnline"
    ? "CustomerBuyGoodsOnline"
    : "CustomerPayBillOnline";
}

function normalizeReceiptTaxLabel(value: unknown) {
  const label = String(value || "VAT")
    .trim()
    .toUpperCase();
  return label === "GST" ? "GST" : "VAT";
}

function normalizeReceiptBrandImageMode(value: unknown) {
  const mode = String(value || "logo")
    .trim()
    .toLowerCase();
  return mode === "favicon" ? "favicon" : "logo";
}

function normalizeReceiptTaxRatePercent(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
}

function normalizeGoogleTrackingId(value: unknown) {
  const text = String(value || "")
    .trim()
    .toUpperCase();
  if (!text) return null;
  return /^(G|UA|AW)-[A-Z0-9-]{4,40}$/.test(text) ? text.slice(0, 50) : null;
}

function normalizeGoogleTagManagerId(value: unknown) {
  const text = String(value || "")
    .trim()
    .toUpperCase();
  if (!text) return null;
  return /^GTM-[A-Z0-9]{4,20}$/.test(text) ? text.slice(0, 30) : null;
}

function normalizeUrl(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString().slice(0, 500)
      : null;
  } catch {
    return null;
  }
}

function normalizeRewardSpend(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

function normalizeRewardPercent(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(95, Math.max(0, Math.round(parsed * 100) / 100));
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
    return NextResponse.json(
      { error: "Failed to load tenant settings" },
      { status: 500 },
    );
  }

  const sensitive = data as Record<string, unknown> | null;
  return NextResponse.json({
    settings: data
      ? {
          ...Object.fromEntries(
            Object.entries(data as Record<string, unknown>).filter(
              ([key]) =>
                ![
                  "stripe_customer_secret_key",
                  "stripe_customer_webhook_secret",
                  "yoco_customer_secret_key",
                  "yoco_customer_webhook_secret",
                  "ozow_private_key",
                  "ozow_api_key",
                  "mpesa_customer_consumer_secret",
                  "daraja_consumer_secret",
                  "daraja_passkey",
                ].includes(key),
            ),
          ),
          stripe_customer_secret_key_set: Boolean(
            sensitive?.stripe_customer_secret_key,
          ),
          stripe_customer_secret_key_hint: secretHint(
            sensitive?.stripe_customer_secret_key,
          ),
          stripe_customer_webhook_secret_set: Boolean(
            sensitive?.stripe_customer_webhook_secret,
          ),
          stripe_customer_webhook_secret_hint: secretHint(
            sensitive?.stripe_customer_webhook_secret,
          ),
          yoco_customer_secret_key_set: Boolean(
            sensitive?.yoco_customer_secret_key,
          ),
          yoco_customer_secret_key_hint: secretHint(
            sensitive?.yoco_customer_secret_key,
          ),
          yoco_customer_webhook_secret_set: Boolean(
            sensitive?.yoco_customer_webhook_secret,
          ),
          yoco_customer_webhook_secret_hint: secretHint(
            sensitive?.yoco_customer_webhook_secret,
          ),
          ozow_private_key_set: Boolean(sensitive?.ozow_private_key),
          ozow_private_key_hint: secretHint(sensitive?.ozow_private_key),
          ozow_api_key_set: Boolean(sensitive?.ozow_api_key),
          ozow_api_key_hint: secretHint(sensitive?.ozow_api_key),
          mpesa_customer_consumer_secret_set: Boolean(
            sensitive?.mpesa_customer_consumer_secret,
          ),
          mpesa_customer_consumer_secret_hint: secretHint(
            sensitive?.mpesa_customer_consumer_secret,
          ),
          daraja_consumer_secret_set: Boolean(
            sensitive?.daraja_consumer_secret,
          ),
          daraja_consumer_secret_hint: secretHint(
            sensitive?.daraja_consumer_secret,
          ),
          daraja_passkey_set: Boolean(sensitive?.daraja_passkey),
          daraja_passkey_hint: secretHint(sensitive?.daraja_passkey),
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
      .select(
        "stripe_customer_secret_key, stripe_customer_webhook_secret, stripe_customer_payments_live, yoco_customer_mode, yoco_customer_secret_key, yoco_customer_webhook_secret, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_payments_live, ozow_private_key, ozow_api_key, ozow_payments_live, mpesa_customer_consumer_secret, daraja_consumer_secret, daraja_passkey",
      )
      .eq("tenant_id", tenantLookup.tenant.id)
      .maybeSingle();

    const stripePublishableKey = normalizeOptionalText(
      body?.stripeCustomerPublishableKey,
      260,
    );
    const stripeSecretKeyInput = normalizeLongSecret(
      body?.stripeCustomerSecretKeyInput,
    );
    const stripeWebhookSecretInput = normalizeLongSecret(
      body?.stripeCustomerWebhookSecretInput,
    );
    const hasStripeSecretKey = Boolean(
      stripeSecretKeyInput ||
      (existingSettings as Record<string, unknown> | null)
        ?.stripe_customer_secret_key,
    );
    const hasStripeWebhookSecret = Boolean(
      stripeWebhookSecretInput ||
      (existingSettings as Record<string, unknown> | null)
        ?.stripe_customer_webhook_secret,
    );
    const requestedStripeCustomerPayments =
      normalizeBoolean(body?.enableStripeCustomerPayments) ?? false;
    const stripeCredentialsReady = Boolean(
      stripePublishableKey && hasStripeSecretKey && hasStripeWebhookSecret,
    );
    const requestedStripeStatus = normalizeStripeConnectionStatus(
      body?.stripeConnectionStatus,
    );
    const nextStripeStatus = stripeCredentialsReady
      ? requestedStripeStatus === "not_configured"
        ? "configured"
        : requestedStripeStatus
      : "not_configured";

    if (requestedStripeCustomerPayments && !stripeCredentialsReady) {
      return NextResponse.json(
        {
          error:
            "Add this tenant's Stripe publishable key, secret key and webhook secret before enabling Stripe for storefront customers.",
        },
        { status: 400 },
      );
    }

    const yocoSecretKeyInput = normalizeLongSecret(
      body?.yocoCustomerSecretKeyInput,
    );
    const yocoWebhookSecretInput = normalizeLongSecret(
      body?.yocoCustomerWebhookSecretInput,
    );
    const nextYocoMode = normalizeYocoMode(body?.yocoCustomerMode);
    const existingYocoMode = normalizeYocoMode(
      (existingSettings as Record<string, unknown> | null)?.yoco_customer_mode,
    );
    const yocoModeChanged =
      Boolean(
        (existingSettings as Record<string, unknown> | null)
          ?.yoco_customer_mode,
      ) && existingYocoMode !== nextYocoMode;
    const yocoSecretChanged = Boolean(yocoSecretKeyInput);
    const shouldResetYocoWebhook =
      (yocoModeChanged || yocoSecretChanged) && !yocoWebhookSecretInput;
    const hasExistingYocoWebhookSecret =
      Boolean(
        (existingSettings as Record<string, unknown> | null)
          ?.yoco_customer_webhook_secret,
      ) && !shouldResetYocoWebhook;
    const hasYocoSecretKey = Boolean(
      yocoSecretKeyInput ||
      (existingSettings as Record<string, unknown> | null)
        ?.yoco_customer_secret_key,
    );
    const hasYocoWebhookSecret = Boolean(
      yocoWebhookSecretInput || hasExistingYocoWebhookSecret,
    );
    const requestedYocoCustomerPayments =
      normalizeBoolean(body?.enableYocoCustomerPayments) ?? false;
    const yocoCurrencyAllowed =
      normalizeCurrencyCode(body?.currencyCode) === "ZAR";
    const yocoCredentialsReady = Boolean(hasYocoSecretKey);
    const requestedYocoPaymentsLive =
      normalizeBoolean(body?.yocoCustomerPaymentsLive) ?? false;
    const requestedYocoStatus = normalizeYocoConnectionStatus(
      body?.yocoConnectionStatus,
    );
    const nextYocoStatus = yocoCredentialsReady
      ? requestedYocoStatus === "not_configured"
        ? "configured"
        : requestedYocoStatus
      : "not_configured";

    if (requestedYocoCustomerPayments && !yocoCurrencyAllowed) {
      return NextResponse.json(
        {
          error:
            "Yoco is currently only enabled for ZAR stores. Change this tenant's currency to ZAR before enabling Yoco.",
        },
        { status: 400 },
      );
    }

    if (requestedYocoCustomerPayments && !yocoCredentialsReady) {
      return NextResponse.json(
        {
          error:
            "Add this tenant's Yoco secret key before enabling Yoco setup for storefront customers.",
        },
        { status: 400 },
      );
    }

    const ozowSiteCode = normalizeOptionalText(body?.ozowSiteCode, 80);
    const ozowPrivateKeyInput = normalizeLongSecret(body?.ozowPrivateKeyInput);
    const ozowApiKeyInput = normalizeLongSecret(body?.ozowApiKeyInput);
    const nextOzowMode = normalizeOzowMode(body?.ozowCustomerMode);
    const hasOzowPrivateKey = Boolean(
      ozowPrivateKeyInput ||
      (existingSettings as Record<string, unknown> | null)?.ozow_private_key,
    );
    const requestedOzowCustomerPayments =
      normalizeBoolean(body?.enableOzowCustomerPayments) ?? false;
    const ozowCurrencyAllowed =
      normalizeCurrencyCode(body?.currencyCode) === "ZAR";
    const ozowCredentialsReady = Boolean(ozowSiteCode && hasOzowPrivateKey);
    const requestedOzowPaymentsLive =
      normalizeBoolean(body?.ozowPaymentsLive) ?? false;
    const requestedOzowStatus = normalizeOzowConnectionStatus(
      body?.ozowConnectionStatus,
    );
    const nextOzowStatus = ozowCredentialsReady
      ? requestedOzowStatus === "not_configured"
        ? "configured"
        : requestedOzowStatus
      : "not_configured";

    if (requestedOzowCustomerPayments && !ozowCurrencyAllowed) {
      return NextResponse.json(
        {
          error:
            "Ozow is currently only enabled for ZAR stores. Change this tenant's currency to ZAR before enabling Ozow.",
        },
        { status: 400 },
      );
    }

    if (requestedOzowCustomerPayments && !ozowCredentialsReady) {
      return NextResponse.json(
        {
          error:
            "Add this tenant's Ozow site code and private key before enabling Ozow for storefront customers.",
        },
        { status: 400 },
      );
    }

    const mpesaConsumerKey = normalizeOptionalText(
      body?.mpesaCustomerConsumerKey,
      260,
    );
    const mpesaConsumerSecretInput = normalizeLongSecret(
      body?.mpesaCustomerConsumerSecretInput,
    );
    const nextMpesaMode = normalizeMpesaMode(body?.mpesaCustomerMode);
    const mpesaIpnId = normalizeOptionalText(body?.mpesaCustomerIpnId, 120);
    const hasMpesaConsumerSecret = Boolean(
      mpesaConsumerSecretInput ||
      (existingSettings as Record<string, unknown> | null)
        ?.mpesa_customer_consumer_secret,
    );
    const requestedMpesaCustomerPayments =
      normalizeBoolean(body?.enableMpesaCustomerPayments) ?? false;
    const mpesaCurrencyAllowed =
      normalizeCurrencyCode(body?.currencyCode) === "KES";
    const mpesaCredentialsReady = Boolean(
      mpesaConsumerKey && hasMpesaConsumerSecret && mpesaIpnId,
    );
    const requestedMpesaPaymentsLive =
      normalizeBoolean(body?.mpesaCustomerPaymentsLive) ?? false;
    const requestedMpesaStatus = normalizeMpesaConnectionStatus(
      body?.mpesaConnectionStatus,
    );
    const nextMpesaStatus = mpesaCredentialsReady
      ? requestedMpesaStatus === "not_configured"
        ? "configured"
        : requestedMpesaStatus
      : "not_configured";

    if (requestedMpesaCustomerPayments && !mpesaCurrencyAllowed) {
      return NextResponse.json(
        {
          error:
            "M-Pesa via Pesapal is currently only enabled for KES stores. Change this tenant's currency to KES before enabling M-Pesa.",
        },
        { status: 400 },
      );
    }

    if (requestedMpesaCustomerPayments && !mpesaCredentialsReady) {
      return NextResponse.json(
        {
          error:
            "Add this tenant's Pesapal consumer key, consumer secret and IPN notification ID before enabling M-Pesa for storefront customers.",
        },
        { status: 400 },
      );
    }

    const darajaConsumerKey = normalizeOptionalText(
      body?.darajaConsumerKey,
      260,
    );
    const darajaConsumerSecretInput = normalizeLongSecret(
      body?.darajaConsumerSecretInput,
    );
    const darajaPasskeyInput = normalizeLongSecret(
      body?.darajaPasskeyInput,
      1200,
    );
    const nextDarajaMode = normalizeDarajaMode(body?.darajaCustomerMode);
    const darajaShortcode = normalizeOptionalText(body?.darajaShortcode, 40);
    const darajaTransactionType = normalizeDarajaTransactionType(
      body?.darajaTransactionType,
    );
    const hasDarajaConsumerSecret = Boolean(
      darajaConsumerSecretInput ||
      (existingSettings as Record<string, unknown> | null)
        ?.daraja_consumer_secret,
    );
    const hasDarajaPasskey = Boolean(
      darajaPasskeyInput ||
      (existingSettings as Record<string, unknown> | null)?.daraja_passkey,
    );
    const requestedDarajaCustomerPayments =
      normalizeBoolean(body?.enableDarajaCustomerPayments) ?? false;
    const darajaCurrencyAllowed =
      normalizeCurrencyCode(body?.currencyCode) === "KES";
    const darajaCredentialsReady = Boolean(
      darajaConsumerKey &&
      hasDarajaConsumerSecret &&
      darajaShortcode &&
      hasDarajaPasskey,
    );
    const requestedDarajaStatus = normalizeDarajaConnectionStatus(
      body?.darajaConnectionStatus,
    );
    const requestedDarajaPaymentsLive =
      normalizeBoolean(body?.darajaPaymentsLive) ?? false;
    const nextDarajaStatus = darajaCredentialsReady
      ? requestedDarajaStatus === "not_configured"
        ? "configured"
        : requestedDarajaStatus
      : "not_configured";

    if (requestedDarajaCustomerPayments && !darajaCurrencyAllowed) {
      return NextResponse.json(
        {
          error:
            "Direct M-Pesa Daraja is currently only prepared for KES stores. Change this tenant's currency to KES before enabling the Daraja setup.",
        },
        { status: 400 },
      );
    }

    if (requestedDarajaCustomerPayments && !darajaCredentialsReady) {
      return NextResponse.json(
        {
          error:
            "Add this tenant's Daraja consumer key, consumer secret, shortcode and passkey before enabling the direct M-Pesa Daraja setup.",
        },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      tenant_id: tenantLookup.tenant.id,
      business_display_name: normalizeOptionalText(
        body?.businessDisplayName,
        120,
      ),
      storefront_heading: normalizeOptionalText(body?.storefrontHeading, 160),
      storefront_subheading: normalizeOptionalText(
        body?.storefrontSubheading,
        400,
      ),
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
      privacy_policy_title: normalizeOptionalText(body?.privacyPolicyTitle, 120) || "Privacy Policy",
      privacy_policy_body: normalizeOptionalText(body?.privacyPolicyBody, 12000),
      privacy_policy_show_on_storefront: normalizeBoolean(body?.privacyPolicyShowOnStorefront) ?? true,
      terms_of_service_title: normalizeOptionalText(body?.termsOfServiceTitle, 120) || "Terms of Service",
      terms_of_service_body: normalizeOptionalText(body?.termsOfServiceBody, 12000),
      terms_of_service_show_on_storefront: normalizeBoolean(body?.termsOfServiceShowOnStorefront) ?? true,
      footer_blurb: normalizeOptionalText(body?.footerBlurb, 240),
      footer_notice: normalizeOptionalText(body?.footerNotice, 240),
      show_orduva_referral_ad:
        normalizeBoolean(body?.showOrduvaReferralAd) ?? true,
      social_facebook_url: normalizeOptionalText(body?.socialFacebookUrl, 500),
      social_instagram_url: normalizeOptionalText(
        body?.socialInstagramUrl,
        500,
      ),
      social_tiktok_url: normalizeOptionalText(body?.socialTikTokUrl, 500),
      social_x_url: normalizeOptionalText(body?.socialXUrl, 500),
      social_website_url: normalizeOptionalText(body?.socialWebsiteUrl, 500),
      currency_name: normalizeOptionalText(body?.currencyName, 80),
      currency_code: normalizeCurrencyCode(body?.currencyCode),
      currency_symbol: normalizeOptionalText(body?.currencySymbol, 12),
      currency_display_mode: normalizeCurrencyDisplayMode(
        body?.currencyDisplayMode,
      ),
      currency_symbol_position: normalizeCurrencySymbolPosition(
        body?.currencySymbolPosition,
      ),
      currency_decimal_places: normalizeCurrencyDecimalPlaces(
        body?.currencyDecimalPlaces,
      ),
      currency_use_thousands_separator: normalizeBoolean(
        body?.currencyUseThousandsSeparator,
      ),
      currency_decimal_separator: normalizeSeparator(
        body?.currencyDecimalSeparator,
      ),
      currency_thousands_separator: normalizeSeparator(
        body?.currencyThousandsSeparator,
      ),
      currency_suffix: normalizeOptionalText(body?.currencySuffix, 12),
      enable_cash_on_collection:
        normalizeBoolean(body?.enableCashOnCollection) ?? true,
      enable_cash_on_delivery:
        normalizeBoolean(body?.enableCashOnDelivery) ?? true,
      enable_stripe_customer_payments:
        requestedStripeCustomerPayments && stripeCredentialsReady,
      stripe_connection_status: nextStripeStatus,
      stripe_customer_payment_mode: normalizeStripePaymentMode(
        body?.stripeCustomerPaymentMode,
      ),
      stripe_customer_publishable_key: stripePublishableKey,
      stripe_customer_account_label: normalizeOptionalText(
        body?.stripeCustomerAccountLabel,
        120,
      ),
      stripe_customer_test_mode:
        normalizeBoolean(body?.stripeCustomerTestMode) ?? true,
      stripe_customer_setup_notes: normalizeOptionalText(
        body?.stripeCustomerSetupNotes,
        500,
      ),
      stripe_customer_payments_live:
        requestedStripeCustomerPayments && stripeCredentialsReady,
      enable_yoco_customer_payments:
        requestedYocoCustomerPayments &&
        yocoCurrencyAllowed &&
        yocoCredentialsReady,
      yoco_connection_status: nextYocoStatus,
      yoco_customer_mode: nextYocoMode,
      yoco_customer_account_label: normalizeOptionalText(
        body?.yocoCustomerAccountLabel,
        120,
      ),
      yoco_customer_setup_notes: normalizeOptionalText(
        body?.yocoCustomerSetupNotes,
        500,
      ),
      yoco_customer_payments_live:
        requestedYocoCustomerPayments &&
        requestedYocoPaymentsLive &&
        yocoCurrencyAllowed &&
        yocoCredentialsReady &&
        (nextYocoMode !== "live" || hasYocoWebhookSecret),
      enable_ozow_customer_payments:
        requestedOzowCustomerPayments &&
        ozowCurrencyAllowed &&
        ozowCredentialsReady,
      ozow_connection_status: nextOzowStatus,
      ozow_customer_mode: nextOzowMode,
      ozow_site_code: ozowSiteCode,
      ozow_account_label: normalizeOptionalText(
        body?.ozowAccountLabel,
        120,
      ),
      ozow_setup_notes: normalizeOptionalText(
        body?.ozowSetupNotes,
        500,
      ),
      ozow_payments_live:
        requestedOzowCustomerPayments &&
        requestedOzowPaymentsLive &&
        ozowCurrencyAllowed &&
        ozowCredentialsReady,
      enable_mpesa_customer_payments:
        requestedMpesaCustomerPayments &&
        mpesaCurrencyAllowed &&
        mpesaCredentialsReady,
      mpesa_connection_status: nextMpesaStatus,
      mpesa_customer_mode: nextMpesaMode,
      mpesa_customer_consumer_key: mpesaConsumerKey,
      mpesa_customer_ipn_id: mpesaIpnId,
      mpesa_customer_account_label: normalizeOptionalText(
        body?.mpesaCustomerAccountLabel,
        120,
      ),
      mpesa_customer_setup_notes: normalizeOptionalText(
        body?.mpesaCustomerSetupNotes,
        500,
      ),
      mpesa_customer_payments_live:
        requestedMpesaCustomerPayments &&
        requestedMpesaPaymentsLive &&
        mpesaCurrencyAllowed &&
        mpesaCredentialsReady,
      enable_daraja_customer_payments:
        requestedDarajaCustomerPayments &&
        darajaCurrencyAllowed &&
        darajaCredentialsReady,
      daraja_connection_status: nextDarajaStatus,
      daraja_customer_mode: nextDarajaMode,
      daraja_consumer_key: darajaConsumerKey,
      daraja_shortcode: darajaShortcode,
      daraja_transaction_type: darajaTransactionType,
      daraja_account_reference_prefix: normalizeOptionalText(
        body?.darajaAccountReferencePrefix,
        40,
      ),
      daraja_callback_url: normalizeOptionalText(body?.darajaCallbackUrl, 500),
      daraja_account_label: normalizeOptionalText(
        body?.darajaAccountLabel,
        120,
      ),
      daraja_setup_notes: normalizeOptionalText(body?.darajaSetupNotes, 500),
      daraja_payments_live:
        requestedDarajaCustomerPayments &&
        requestedDarajaPaymentsLive &&
        darajaCurrencyAllowed &&
        darajaCredentialsReady,
      rewards_enabled: normalizeBoolean(body?.rewardsEnabled) ?? false,
      rewards_program_name:
        normalizeOptionalText(body?.rewardsProgramName, 80) || "Rewards Club",
      rewards_silver_min_spend: 0,
      rewards_silver_discount_percent: normalizeRewardPercent(
        body?.rewardsSilverDiscountPercent,
        0,
      ),
      rewards_gold_min_spend: normalizeRewardSpend(
        body?.rewardsGoldMinSpend,
        1000,
      ),
      rewards_gold_discount_percent: normalizeRewardPercent(
        body?.rewardsGoldDiscountPercent,
        5,
      ),
      rewards_platinum_min_spend: Math.max(
        normalizeRewardSpend(body?.rewardsGoldMinSpend, 1000),
        normalizeRewardSpend(body?.rewardsPlatinumMinSpend, 2500),
      ),
      rewards_platinum_discount_percent: normalizeRewardPercent(
        body?.rewardsPlatinumDiscountPercent,
        10,
      ),
      discounts_enabled: normalizeBoolean(body?.discountsEnabled) ?? false,
      discount_popup_enabled:
        normalizeBoolean(body?.discountPopupEnabled) ?? false,
      discount_popup_title:
        normalizeOptionalText(body?.discountPopupTitle, 120) ||
        "Today's offers",
      discount_popup_message:
        normalizeOptionalText(body?.discountPopupMessage, 240) ||
        "Tap an offer at checkout to apply it to your order.",
      discount_rules: serializeDiscountRules(body?.discountRules),
      receipt_document_name:
        normalizeOptionalText(body?.receiptDocumentName, 80) || "Receipt",
      receipt_tax_label: normalizeReceiptTaxLabel(body?.receiptTaxLabel),
      receipt_tax_number: normalizeOptionalText(body?.receiptTaxNumber, 80),
      receipt_tax_rate_percent: normalizeReceiptTaxRatePercent(
        body?.receiptTaxRatePercent,
      ),
      receipt_extra_field_1_enabled:
        normalizeBoolean(body?.receiptExtraField1Enabled) ?? false,
      receipt_extra_field_1_label: normalizeOptionalText(
        body?.receiptExtraField1Label,
        80,
      ),
      receipt_extra_field_1_value: normalizeOptionalText(
        body?.receiptExtraField1Value,
        160,
      ),
      receipt_extra_field_2_enabled:
        normalizeBoolean(body?.receiptExtraField2Enabled) ?? false,
      receipt_extra_field_2_label: normalizeOptionalText(
        body?.receiptExtraField2Label,
        80,
      ),
      receipt_extra_field_2_value: normalizeOptionalText(
        body?.receiptExtraField2Value,
        160,
      ),
      receipt_footer_message: normalizeOptionalText(
        body?.receiptFooterMessage,
        700,
      ),
      receipt_brand_image_mode: normalizeReceiptBrandImageMode(
        body?.receiptBrandImageMode,
      ),
      seo_page_name: normalizeOptionalText(body?.seoPageName, 55),
      seo_meta_description: normalizeOptionalText(
        body?.seoMetaDescription,
        160,
      ),
      seo_keywords: normalizeOptionalText(body?.seoKeywords, 240),
      seo_canonical_url: normalizeUrl(body?.seoCanonicalUrl),
      seo_structured_data_enabled:
        normalizeBoolean(body?.seoStructuredDataEnabled) ?? true,
      google_tracking_id: normalizeGoogleTrackingId(body?.googleTrackingId),
      google_tag_manager_id: normalizeGoogleTagManagerId(
        body?.googleTagManagerId,
      ),
      invoice_payments_enabled:
        normalizeBoolean(body?.invoicePaymentsEnabled) ?? false,
      invoice_payments_section_title:
        normalizeOptionalText(body?.invoicePaymentsSectionTitle, 80) ||
        "Payments",
      invoice_payments_intro_text:
        normalizeOptionalText(body?.invoicePaymentsIntroText, 180) ||
        "Pay an invoice, deposit or statement balance securely online.",
      invoice_payments_invoice_enabled:
        normalizeBoolean(body?.invoicePaymentsInvoiceEnabled) ?? true,
      invoice_payments_deposit_enabled:
        normalizeBoolean(body?.invoicePaymentsDepositEnabled) ?? true,
      invoice_payments_balance_enabled:
        normalizeBoolean(body?.invoicePaymentsBalanceEnabled) ?? true,
    };

    if (stripeSecretKeyInput)
      payload.stripe_customer_secret_key = stripeSecretKeyInput;
    if (stripeWebhookSecretInput)
      payload.stripe_customer_webhook_secret = stripeWebhookSecretInput;
    if (yocoSecretKeyInput)
      payload.yoco_customer_secret_key = yocoSecretKeyInput;
    if (yocoWebhookSecretInput)
      payload.yoco_customer_webhook_secret = yocoWebhookSecretInput;
    if (ozowPrivateKeyInput) payload.ozow_private_key = ozowPrivateKeyInput;
    if (ozowApiKeyInput) payload.ozow_api_key = ozowApiKeyInput;
    if (mpesaConsumerSecretInput)
      payload.mpesa_customer_consumer_secret = mpesaConsumerSecretInput;
    if (darajaConsumerSecretInput)
      payload.daraja_consumer_secret = darajaConsumerSecretInput;
    if (darajaPasskeyInput) payload.daraja_passkey = darajaPasskeyInput;
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
      return NextResponse.json(
        { error: "Failed to save tenant settings" },
        { status: 500 },
      );
    }

    const safeData = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(
        ([key]) =>
          ![
            "stripe_customer_secret_key",
            "stripe_customer_webhook_secret",
            "yoco_customer_secret_key",
            "yoco_customer_webhook_secret",
            "ozow_private_key",
            "ozow_api_key",
            "mpesa_customer_consumer_secret",
            "daraja_consumer_secret",
            "daraja_passkey",
          ].includes(key),
      ),
    );
    return NextResponse.json({
      settings: {
        ...safeData,
        stripe_customer_secret_key_set: Boolean(
          stripeSecretKeyInput ||
          (existingSettings as Record<string, unknown> | null)
            ?.stripe_customer_secret_key,
        ),
        stripe_customer_secret_key_hint: secretHint(
          stripeSecretKeyInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.stripe_customer_secret_key,
        ),
        stripe_customer_webhook_secret_set: Boolean(
          stripeWebhookSecretInput ||
          (existingSettings as Record<string, unknown> | null)
            ?.stripe_customer_webhook_secret,
        ),
        stripe_customer_webhook_secret_hint: secretHint(
          stripeWebhookSecretInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.stripe_customer_webhook_secret,
        ),
        yoco_customer_secret_key_set: Boolean(
          yocoSecretKeyInput ||
          (existingSettings as Record<string, unknown> | null)
            ?.yoco_customer_secret_key,
        ),
        yoco_customer_secret_key_hint: secretHint(
          yocoSecretKeyInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.yoco_customer_secret_key,
        ),
        yoco_customer_webhook_secret_set: Boolean(
          yocoWebhookSecretInput || hasExistingYocoWebhookSecret,
        ),
        yoco_customer_webhook_secret_hint: secretHint(
          yocoWebhookSecretInput ||
            (hasExistingYocoWebhookSecret
              ? (existingSettings as Record<string, unknown> | null)
                  ?.yoco_customer_webhook_secret
              : null),
        ),
        ozow_private_key_set: Boolean(
          ozowPrivateKeyInput ||
          (existingSettings as Record<string, unknown> | null)?.ozow_private_key,
        ),
        ozow_private_key_hint: secretHint(
          ozowPrivateKeyInput ||
          (existingSettings as Record<string, unknown> | null)?.ozow_private_key,
        ),
        ozow_api_key_set: Boolean(
          ozowApiKeyInput ||
          (existingSettings as Record<string, unknown> | null)?.ozow_api_key,
        ),
        ozow_api_key_hint: secretHint(
          ozowApiKeyInput ||
          (existingSettings as Record<string, unknown> | null)?.ozow_api_key,
        ),
        mpesa_customer_consumer_secret_set: Boolean(
          mpesaConsumerSecretInput ||
          (existingSettings as Record<string, unknown> | null)
            ?.mpesa_customer_consumer_secret,
        ),
        mpesa_customer_consumer_secret_hint: secretHint(
          mpesaConsumerSecretInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.mpesa_customer_consumer_secret,
        ),
        daraja_consumer_secret_set: Boolean(
          darajaConsumerSecretInput ||
          (existingSettings as Record<string, unknown> | null)
            ?.daraja_consumer_secret,
        ),
        daraja_consumer_secret_hint: secretHint(
          darajaConsumerSecretInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.daraja_consumer_secret,
        ),
        daraja_passkey_set: Boolean(
          darajaPasskeyInput ||
          (existingSettings as Record<string, unknown> | null)?.daraja_passkey,
        ),
        daraja_passkey_hint: secretHint(
          darajaPasskeyInput ||
            (existingSettings as Record<string, unknown> | null)
              ?.daraja_passkey,
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save tenant settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
