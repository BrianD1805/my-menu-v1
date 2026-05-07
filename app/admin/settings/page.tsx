import AdminShell from "@/components/admin/AdminShell";
import TenantSettingsForm from "@/components/admin/TenantSettingsForm";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";
import { DEFAULT_MONEY_SETTINGS } from "@/lib/money";

export default async function AdminSettingsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
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
        }}
      />
    </AdminShell>
  );
}
