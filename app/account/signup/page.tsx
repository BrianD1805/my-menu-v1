import CustomerAuthForm from "@/components/account/CustomerAuthForm";
import { resolveTenantSlug, getTenantBySlug } from "@/lib/tenant-server";
import { getTenantSettings, buildTenantBranding } from "@/lib/tenant-settings";

export default async function CustomerSignupPage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 sm:px-5 lg:px-6">
      <CustomerAuthForm mode="signup" tenantName={branding.displayName} />
    </main>
  );
}
