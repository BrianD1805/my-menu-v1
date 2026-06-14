import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

async function getTenant(tenantSlug: string) {
  const tenantTimer = startLoadTimer("api/products tenant lookup");
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select(
      "id, slug, name, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name",
    )
    .eq("slug", tenantSlug)
    .single();
  tenantTimer.end({ tenantSlug, found: Boolean(tenant) });

  if (!tenantError && tenant) {
    return { tenant };
  }

  // Ver-0.170 keeps the same public demo fallback used by the server route.
  if (tenantSlug === "zimzaexpress") {
    const legacyResult = await db
      .from("tenants")
      .select(
        "id, slug, name, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name",
      )
      .eq("slug", "orduva")
      .single();

    if (!legacyResult.error && legacyResult.data) {
      return { tenant: legacyResult.data };
    }
  }

  return {
    error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
  };
}

export async function GET(req: Request) {
  const totalTimer = startLoadTimer("api/products total");
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenantSlug" }, { status: 400 });
  }

  const tenantLookup = await getTenant(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;
  const tenant = tenantLookup.tenant!;

  const dataTimer = startLoadTimer(
    "api/products products/categories/settings parallel load",
  );
  const [productsResult, categoriesResult, settings] = await Promise.all([
    db
      .from("products")
      .select(
        "id, name, description, image_url, price, is_active, category_id, secondary_category_id, stock_enabled, stock_quantity, low_stock_threshold, variants_enabled, variant_label, product_variants, product_type, custom_amount_enabled, custom_amount_label, custom_amount_reference_label, custom_amount_reference_required, custom_amount_min, custom_amount_max, custom_amount_help_text, custom_amount_disable_rewards, custom_amount_disable_discounts, preorder_enabled, preorder_when_out_of_stock",
      )
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    db
      .from("categories")
      .select("id, name, sort_order")
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true }),
    getTenantSettings(tenant.id),
  ]);
  dataTimer.end({
    products: productsResult.data?.length || 0,
    categories: categoriesResult.data?.length || 0,
    productsError: Boolean(productsResult.error),
    categoriesError: Boolean(categoriesResult.error),
  });

  if (productsResult.error || categoriesResult.error) {
    return NextResponse.json(
      { error: "Failed to load storefront data" },
      { status: 500 },
    );
  }

  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);
  totalTimer.end({ tenantSlug });

  const payload = {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
    categories: categoriesResult.data || [],
    products: productsResult.data || [],
    settings: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      logoUrl: branding.logoUrl,
      storefrontHeading: branding.storefrontHeading,
      storefrontSubheading: branding.storefrontSubheading,
      currencyName: branding.currencyName,
      currencyCode: branding.currencyCode,
      currencySymbol: branding.currencySymbol,
      currencyDisplayMode: branding.currencyDisplayMode,
      currencySymbolPosition: branding.currencySymbolPosition,
      currencyDecimalPlaces: branding.currencyDecimalPlaces,
      currencyUseThousandsSeparator: branding.currencyUseThousandsSeparator,
      currencyDecimalSeparator: branding.currencyDecimalSeparator,
      currencyThousandsSeparator: branding.currencyThousandsSeparator,
      currencySuffix: branding.currencySuffix,
      displayName: branding.displayName,
      contactPhone: branding.contactPhone,
      contactEmail: branding.contactEmail,
      contactWhatsApp: branding.contactWhatsApp,
      contactAddress: branding.contactAddress,
      footerBlurb: branding.footerBlurb,
      footerNotice: branding.footerNotice,
      showOrduvaReferralAd: branding.showOrduvaReferralAd,
      socialFacebookUrl: branding.socialFacebookUrl,
      socialInstagramUrl: branding.socialInstagramUrl,
      socialTikTokUrl: branding.socialTikTokUrl,
      socialXUrl: branding.socialXUrl,
      socialWebsiteUrl: branding.socialWebsiteUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      backgroundTint: branding.backgroundTint,
      borderColor: branding.borderColor,
      textColor: branding.textColor,
      storefrontTheme: branding.storefrontTheme,
      trialState,
      enableCashOnCollection: settings?.enable_cash_on_collection !== false,
      enableCashOnDelivery: settings?.enable_cash_on_delivery !== false,
      enableStripeCustomerPayments:
        settings?.enable_stripe_customer_payments === true,
      stripeConnectionStatus:
        settings?.stripe_connection_status || "not_configured",
      stripeCustomerPaymentsLive:
        settings?.stripe_customer_payments_live === true,
      enableYocoCustomerPayments:
        settings?.enable_yoco_customer_payments === true,
      yocoConnectionStatus:
        settings?.yoco_connection_status || "not_configured",
      yocoCustomerPaymentsLive: settings?.yoco_customer_payments_live === true,
      enableMpesaCustomerPayments:
        settings?.enable_mpesa_customer_payments === true,
      mpesaConnectionStatus:
        settings?.mpesa_connection_status || "not_configured",
      mpesaCustomerPaymentsLive:
        settings?.mpesa_customer_payments_live === true,
      enableDarajaCustomerPayments:
        settings?.enable_daraja_customer_payments === true,
      darajaConnectionStatus:
        settings?.daraja_connection_status || "not_configured",
      darajaPaymentsLive: settings?.daraja_payments_live === true,
      rewardsEnabled: settings?.rewards_enabled === true,
      rewardsProgramName: settings?.rewards_program_name || "Rewards Club",
      rewardsSilverDiscountPercent: Number(
        settings?.rewards_silver_discount_percent || 0,
      ),
      rewardsGoldMinSpend: Number(settings?.rewards_gold_min_spend || 1000),
      rewardsGoldDiscountPercent: Number(
        settings?.rewards_gold_discount_percent || 5,
      ),
      rewardsPlatinumMinSpend: Number(
        settings?.rewards_platinum_min_spend || 2500,
      ),
      rewardsPlatinumDiscountPercent: Number(
        settings?.rewards_platinum_discount_percent || 10,
      ),
      discountsEnabled: settings?.discounts_enabled === true,
      discountPopupEnabled: settings?.discount_popup_enabled === true,
      discountPopupTitle: settings?.discount_popup_title || "Today's offers",
      discountPopupMessage:
        settings?.discount_popup_message ||
        "Tap an offer at checkout to apply it to your order.",
      discountRules: Array.isArray(settings?.discount_rules)
        ? settings.discount_rules
        : [],
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
      preordersEnabled: settings?.preorders_enabled !== false,
      preorderDepositPercent: Number(settings?.preorder_deposit_percent || 25),
      privacyPolicyShowOnStorefront: settings?.privacy_policy_show_on_storefront !== false,
      termsOfServiceShowOnStorefront: settings?.terms_of_service_show_on_storefront !== false,
    },
  };

  return NextResponse.json(payload, {
    headers: {
      // Ver-0.172: this menu data is public tenant storefront data, so it can
      // be cached briefly at the edge and reused by the storefront service
      // worker/local cache while fresh data is refreshed in the background.
      // Ver-0.231C: invoice/payment settings need to appear immediately after a tenant saves them.
      // Keep browser/edge caching off for this endpoint so storefront settings do not lag behind admin changes.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
