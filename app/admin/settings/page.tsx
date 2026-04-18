import AdminShell from "@/components/admin/AdminShell";
import TenantSettingsForm from "@/components/admin/TenantSettingsForm";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export default async function AdminSettingsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.name, settings);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="settings"
      title="Tenant settings"
      description="Set the business identity, contact details, footer wording, and core currency display for this tenant without disturbing the accepted product card layout."
      logoUrl={branding.logoUrl}
      accentColor={branding.accentColor}
    >
      <div className="mb-6 rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
        This tenant-scoped settings layer now covers branding, contact details, storefront footer info, and currency display foundations.
      </div>

      <TenantSettingsForm
        tenantName={tenant.name}
        initial={{
          businessDisplayName: settings?.business_display_name || "",
          storefrontHeading: settings?.storefront_heading || "",
          storefrontSubheading: settings?.storefront_subheading || "",
          adminHeadingLabel: settings?.admin_heading_label || "",
          logoUrl: settings?.logo_url || "",
          primaryColor: settings?.primary_color || "#0F172A",
          accentColor: settings?.accent_color || "#10B981",
          contactPhone: settings?.contact_phone || "",
          contactEmail: settings?.contact_email || "",
          contactWhatsApp: settings?.contact_whatsapp || "",
          contactAddress: settings?.contact_address || "",
          footerBlurb: settings?.footer_blurb || "",
          footerNotice: settings?.footer_notice || "",
          currencyName: settings?.currency_name || "Pounds Sterling",
          currencyCode: settings?.currency_code || "GBP",
          currencySymbol: settings?.currency_symbol || "£",
        }}
      />
    </AdminShell>
  );
}
