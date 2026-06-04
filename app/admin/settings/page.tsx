import AdminShell from "@/components/admin/AdminShell";
import TenantSettingsForm from "@/components/admin/TenantSettingsForm";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";
import { DEFAULT_MONEY_SETTINGS } from "@/lib/money";
import { db } from "@/lib/db";

export default async function AdminSettingsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const [{ data: stripeSecretSummary }, { data: checklistVisibilityRow }] =
    await Promise.all([
      db
        .from("tenant_settings")
        .select(
          "stripe_customer_secret_key, stripe_customer_webhook_secret, yoco_customer_secret_key, yoco_customer_webhook_secret, yoco_customer_webhook_id, yoco_customer_webhook_url, mpesa_customer_consumer_secret, daraja_consumer_secret, daraja_passkey",
        )
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      db
        .from("tenant_launch_checklists")
        .select("status")
        .eq("tenant_id", tenant.id)
        .eq("checklist_key", "__dismissed")
        .maybeSingle(),
    ]);
  const stripeSecrets = stripeSecretSummary as Record<string, unknown> | null;
  const stripeSecretKey = String(
    stripeSecrets?.stripe_customer_secret_key || "",
  ).trim();
  const stripeWebhookSecret = String(
    stripeSecrets?.stripe_customer_webhook_secret || "",
  ).trim();
  const yocoSecretKey = String(
    stripeSecrets?.yoco_customer_secret_key || "",
  ).trim();
  const yocoWebhookSecret = String(
    stripeSecrets?.yoco_customer_webhook_secret || "",
  ).trim();
  const mpesaConsumerSecret = String(
    stripeSecrets?.mpesa_customer_consumer_secret || "",
  ).trim();
  const darajaConsumerSecret = String(
    stripeSecrets?.daraja_consumer_secret || "",
  ).trim();
  const darajaPasskey = String(stripeSecrets?.daraja_passkey || "").trim();
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="settings"
      title="Store settings"
      description="Set the business identity, contact details, footer wording, advanced currency display, and storefront presentation for this store without disturbing the accepted product card layout."
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
    >
      <div className="mb-6 rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
        This store-scoped settings layer covers branding, contact details,
        storefront footer info, advanced currency display foundations, and
        visual identity for this store.
      </div>

      <TenantSettingsForm
        tenantName={tenant.name}
        initial={{
          businessDisplayName: settings?.business_display_name || "",
          storefrontHeading: settings?.storefront_heading || "",
          storefrontSubheading: settings?.storefront_subheading || "",
          adminHeadingLabel: settings?.admin_heading_label || "",
          logoUrl: settings?.logo_url || "",
          faviconUrl: settings?.favicon_url || "",
          primaryColor: settings?.primary_color || "#0F172A",
          accentColor: settings?.accent_color || "#10B981",
          backgroundTint: settings?.background_tint || "#F8F4F0",
          borderColor: settings?.border_color || "#D9C7A3",
          textColor: settings?.text_color || "#2B2B2B",
          storefrontTheme:
            settings?.storefront_theme_json || branding.storefrontTheme || null,
          contactPhone: settings?.contact_phone || "",
          contactEmail: settings?.contact_email || "",
          contactWhatsApp: settings?.contact_whatsapp || "",
          contactAddress: settings?.contact_address || "",
          footerBlurb: settings?.footer_blurb || "",
          footerNotice: settings?.footer_notice || "",
          showOrduvaReferralAd: settings?.show_orduva_referral_ad !== false,
          showAdminLaunchChecklist:
            String(checklistVisibilityRow?.status || "").toLowerCase() !==
            "complete",
          socialFacebookUrl: settings?.social_facebook_url || "",
          socialInstagramUrl: settings?.social_instagram_url || "",
          socialTikTokUrl: settings?.social_tiktok_url || "",
          socialXUrl: settings?.social_x_url || "",
          socialWebsiteUrl: settings?.social_website_url || "",
          currencyName:
            settings?.currency_name ?? DEFAULT_MONEY_SETTINGS.currencyName,
          currencyCode:
            settings?.currency_code ?? DEFAULT_MONEY_SETTINGS.currencyCode,
          currencySymbol:
            settings?.currency_symbol ?? DEFAULT_MONEY_SETTINGS.currencySymbol,
          currencyDisplayMode:
            settings?.currency_display_mode ??
            DEFAULT_MONEY_SETTINGS.currencyDisplayMode,
          currencySymbolPosition:
            settings?.currency_symbol_position ??
            DEFAULT_MONEY_SETTINGS.currencySymbolPosition,
          currencyDecimalPlaces: String(
            settings?.currency_decimal_places ??
              DEFAULT_MONEY_SETTINGS.currencyDecimalPlaces,
          ),
          currencyUseThousandsSeparator:
            settings?.currency_use_thousands_separator ??
            DEFAULT_MONEY_SETTINGS.currencyUseThousandsSeparator,
          currencyDecimalSeparator:
            settings?.currency_decimal_separator ??
            DEFAULT_MONEY_SETTINGS.currencyDecimalSeparator,
          currencyThousandsSeparator:
            settings?.currency_thousands_separator ??
            DEFAULT_MONEY_SETTINGS.currencyThousandsSeparator,
          currencySuffix:
            settings?.currency_suffix ?? DEFAULT_MONEY_SETTINGS.currencySuffix,
          enableCashOnCollection: settings?.enable_cash_on_collection !== false,
          enableCashOnDelivery: settings?.enable_cash_on_delivery !== false,
          enableStripeCustomerPayments:
            settings?.enable_stripe_customer_payments === true,
          stripeConnectionStatus:
            settings?.stripe_connection_status || "not_configured",
          stripeCustomerPaymentMode:
            settings?.stripe_customer_payment_mode === "stripe_connect"
              ? "stripe_connect"
              : "manual_keys",
          stripeCustomerPublishableKey:
            settings?.stripe_customer_publishable_key || "",
          stripeCustomerSecretKeyInput: "",
          stripeCustomerSecretKeySet: Boolean(stripeSecretKey),
          stripeCustomerSecretKeyHint: stripeSecretKey
            ? `••••${stripeSecretKey.slice(-4)}`
            : "",
          stripeCustomerWebhookSecretInput: "",
          stripeCustomerWebhookSecretSet: Boolean(stripeWebhookSecret),
          stripeCustomerWebhookSecretHint: stripeWebhookSecret
            ? `••••${stripeWebhookSecret.slice(-4)}`
            : "",
          stripeCustomerAccountLabel:
            settings?.stripe_customer_account_label || "",
          stripeCustomerTestMode: settings?.stripe_customer_test_mode !== false,
          stripeCustomerSetupNotes: settings?.stripe_customer_setup_notes || "",
          stripeCustomerPaymentsLive:
            settings?.stripe_customer_payments_live === true,
          enableYocoCustomerPayments:
            settings?.enable_yoco_customer_payments === true,
          yocoConnectionStatus:
            settings?.yoco_connection_status || "not_configured",
          yocoCustomerMode:
            settings?.yoco_customer_mode === "live" ? "live" : "test",
          yocoCustomerSecretKeyInput: "",
          yocoCustomerSecretKeySet: Boolean(yocoSecretKey),
          yocoCustomerSecretKeyHint: yocoSecretKey
            ? `••••${yocoSecretKey.slice(-4)}`
            : "",
          yocoCustomerWebhookSecretInput: "",
          yocoCustomerWebhookSecretSet: Boolean(yocoWebhookSecret),
          yocoCustomerWebhookSecretHint: yocoWebhookSecret
            ? `••••${yocoWebhookSecret.slice(-4)}`
            : "",
          yocoCustomerWebhookId: String(
            stripeSecrets?.yoco_customer_webhook_id || "",
          ),
          yocoCustomerWebhookUrl: String(
            stripeSecrets?.yoco_customer_webhook_url || "",
          ),
          yocoCustomerAccountLabel: settings?.yoco_customer_account_label || "",
          yocoCustomerSetupNotes: settings?.yoco_customer_setup_notes || "",
          yocoCustomerPaymentsLive:
            settings?.yoco_customer_payments_live === true,
          enableMpesaCustomerPayments:
            settings?.enable_mpesa_customer_payments === true,
          mpesaConnectionStatus:
            settings?.mpesa_connection_status || "not_configured",
          mpesaCustomerMode:
            settings?.mpesa_customer_mode === "live" ? "live" : "test",
          mpesaCustomerConsumerKey: settings?.mpesa_customer_consumer_key || "",
          mpesaCustomerConsumerSecretInput: "",
          mpesaCustomerConsumerSecretSet: Boolean(mpesaConsumerSecret),
          mpesaCustomerConsumerSecretHint: mpesaConsumerSecret
            ? `••••${mpesaConsumerSecret.slice(-4)}`
            : "",
          mpesaCustomerIpnId: settings?.mpesa_customer_ipn_id || "",
          mpesaCustomerAccountLabel:
            settings?.mpesa_customer_account_label || "",
          mpesaCustomerSetupNotes: settings?.mpesa_customer_setup_notes || "",
          mpesaCustomerPaymentsLive:
            settings?.mpesa_customer_payments_live === true,
          enableDarajaCustomerPayments:
            settings?.enable_daraja_customer_payments === true,
          darajaConnectionStatus:
            settings?.daraja_connection_status || "not_configured",
          darajaCustomerMode:
            settings?.daraja_customer_mode === "live" ? "live" : "sandbox",
          darajaConsumerKey: settings?.daraja_consumer_key || "",
          darajaConsumerSecretInput: "",
          darajaConsumerSecretSet: Boolean(darajaConsumerSecret),
          darajaConsumerSecretHint: darajaConsumerSecret
            ? `••••${darajaConsumerSecret.slice(-4)}`
            : "",
          darajaShortcode: settings?.daraja_shortcode || "",
          darajaPasskeyInput: "",
          darajaPasskeySet: Boolean(darajaPasskey),
          darajaPasskeyHint: darajaPasskey
            ? `••••${darajaPasskey.slice(-4)}`
            : "",
          darajaTransactionType:
            settings?.daraja_transaction_type === "CustomerBuyGoodsOnline"
              ? "CustomerBuyGoodsOnline"
              : "CustomerPayBillOnline",
          darajaAccountReferencePrefix:
            settings?.daraja_account_reference_prefix || "ORDUVA",
          darajaCallbackUrl:
            settings?.daraja_callback_url ||
            "https://www.orduva.com/api/storefront/daraja/callback",
          darajaAccountLabel: settings?.daraja_account_label || "",
          darajaSetupNotes: settings?.daraja_setup_notes || "",
          darajaPaymentsLive: settings?.daraja_payments_live === true,
          rewardsEnabled: settings?.rewards_enabled === true,
          rewardsProgramName: settings?.rewards_program_name || "Rewards Club",
          rewardsSilverDiscountPercent: String(
            settings?.rewards_silver_discount_percent ?? 0,
          ),
          rewardsGoldMinSpend: String(settings?.rewards_gold_min_spend ?? 1000),
          rewardsGoldDiscountPercent: String(
            settings?.rewards_gold_discount_percent ?? 5,
          ),
          rewardsPlatinumMinSpend: String(
            settings?.rewards_platinum_min_spend ?? 2500,
          ),
          rewardsPlatinumDiscountPercent: String(
            settings?.rewards_platinum_discount_percent ?? 10,
          ),
          discountsEnabled: settings?.discounts_enabled === true,
          discountPopupEnabled: settings?.discount_popup_enabled === true,
          discountPopupTitle:
            settings?.discount_popup_title || "Today's offers",
          discountPopupMessage:
            settings?.discount_popup_message ||
            "Tap an offer at checkout to apply it to your order.",
          discountRules: Array.isArray(settings?.discount_rules)
            ? settings.discount_rules
            : [],
          receiptDocumentName: settings?.receipt_document_name || "Receipt",
          receiptTaxLabel:
            settings?.receipt_tax_label === "GST" ? "GST" : "VAT",
          receiptTaxNumber: settings?.receipt_tax_number || "",
          receiptTaxRatePercent: String(
            settings?.receipt_tax_rate_percent ?? 0,
          ),
          receiptExtraField1Enabled:
            settings?.receipt_extra_field_1_enabled === true,
          receiptExtraField1Label: settings?.receipt_extra_field_1_label || "",
          receiptExtraField1Value: settings?.receipt_extra_field_1_value || "",
          receiptExtraField2Enabled:
            settings?.receipt_extra_field_2_enabled === true,
          receiptExtraField2Label: settings?.receipt_extra_field_2_label || "",
          receiptExtraField2Value: settings?.receipt_extra_field_2_value || "",
          receiptFooterMessage: settings?.receipt_footer_message || "",
          receiptBrandImageMode:
            settings?.receipt_brand_image_mode === "favicon"
              ? "favicon"
              : "logo",
          seoPageName: settings?.seo_page_name || "",
          seoMetaDescription: settings?.seo_meta_description || "",
          seoKeywords: settings?.seo_keywords || "",
          seoCanonicalUrl: settings?.seo_canonical_url || "",
          seoStructuredDataEnabled:
            settings?.seo_structured_data_enabled !== false,
          googleTrackingId: settings?.google_tracking_id || "",
          googleTagManagerId: settings?.google_tag_manager_id || "",
          invoicePaymentsEnabled: settings?.invoice_payments_enabled === true,
          invoicePaymentsSectionTitle:
            settings?.invoice_payments_section_title || "Payments",
          invoicePaymentsIntroText:
            settings?.invoice_payments_intro_text ||
            "Pay an invoice, deposit or statement balance securely online.",
          invoicePaymentsInvoiceEnabled:
            settings?.invoice_payments_invoice_enabled !== false,
          invoicePaymentsDepositEnabled:
            settings?.invoice_payments_deposit_enabled !== false,
          invoicePaymentsBalanceEnabled:
            settings?.invoice_payments_balance_enabled !== false,
        }}
      />
    </AdminShell>
  );
}
