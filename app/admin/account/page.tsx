import AdminShell from "@/components/admin/AdminShell";
import TenantAccountManager from "@/components/admin/TenantAccountManager";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

export default async function AdminAccountPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="account"
      title="My Account"
      description="Manage tenant account details, login email, password and optional dispatch address information."
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
    >
      <TenantAccountManager
        initial={{
          fullName: user.full_name || "",
          email: user.email || "",
          legalBusinessName: settings?.account_business_legal_name || tenant.name || "",
          contactName: settings?.account_contact_name || user.full_name || "",
          accountPhone: settings?.account_phone || "",
          accountEmail: settings?.account_email || user.email || "",
          accountAddressLine1: settings?.account_address_line_1 || "",
          accountAddressLine2: settings?.account_address_line_2 || "",
          accountCity: settings?.account_city || "",
          accountRegion: settings?.account_region || "",
          accountPostcode: settings?.account_postcode || "",
          accountCountry: settings?.account_country || "",
          shipFromName: settings?.ship_from_name || tenant.name || "",
          shipFromAddressLine1: settings?.ship_from_address_line_1 || "",
          shipFromAddressLine2: settings?.ship_from_address_line_2 || "",
          shipFromCity: settings?.ship_from_city || "",
          shipFromRegion: settings?.ship_from_region || "",
          shipFromPostcode: settings?.ship_from_postcode || "",
          shipFromCountry: settings?.ship_from_country || "",
          currentPasswordForEmail: "",
        }}
      />
    </AdminShell>
  );
}
