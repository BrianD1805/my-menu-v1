import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { resolveTenantSlug, getTenantBySlug } from "@/lib/tenant-server";
import { getTenantSettings, buildTenantBranding } from "@/lib/tenant-settings";

export default async function CustomerForgotPasswordPage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 sm:px-5 lg:px-6">
      <ForgotPasswordForm scope="customer" tenantName={branding.displayName} />
    </main>
  );
}
