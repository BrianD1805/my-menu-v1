import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import AnalyticsDashboardPanel from "@/components/analytics/AnalyticsDashboardPanel";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

export default async function AdminAnalyticsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="analytics"
      title="Store analytics"
      description="See lightweight storefront stats for this tenant, including visits, product views, shares, add-to-cart and checkout starts."
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
      pageTone="white"
    >
      <AnalyticsDashboardPanel mode="tenant" />
    </AdminShell>
  );
}
