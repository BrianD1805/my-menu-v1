import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

function ActionCard({
  href,
  eyebrow,
  title,
  body,
  toneClass,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  toneClass: string;
}) {
  return (
    <a
      href={href}
      className={`group rounded-[26px] border border-[#0E0E10]/10 p-5 shadow-[0_16px_38px_rgba(14,14,16,0.06)] transition hover:-translate-y-0.5 hover:border-[#FF6A3D]/35 hover:shadow-[0_24px_60px_rgba(14,14,16,0.11)] ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B85A35]">{eyebrow}</p>
      <div className="mt-3 flex min-h-[150px] flex-col justify-between gap-5 sm:min-h-[164px]">
        <div>
          <h2 className="text-xl font-bold text-[#1F2328]">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#4F535A]">{body}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0E0E10]/10 bg-white/85 px-4 py-2 text-sm font-extrabold text-[#0E0E10] shadow-[0_10px_24px_rgba(14,14,16,0.08)] transition group-hover:border-[#FF6A3D]/45 group-hover:bg-[#0E0E10] group-hover:text-white">
          <span>Open</span>
          <span aria-hidden="true" className="transition group-hover:translate-x-0.5">↗</span>
        </div>
      </div>
    </a>
  );
}

export default async function AdminHomePage() {
  const { tenant, user } = await requireAdminPageUser();

  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="home"
      title="Welcome back"
      description={`Signed in as ${user.full_name || user.email}. Start with the launch checklist, then open the area you need.`}
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          href="/admin/orders"
          eyebrow="Operations"
          title="Orders"
          body="Open the live orders view, spot new orders quickly, update statuses, and keep customer messaging focused in one place."
          toneClass="bg-[#FFF3EA]"
        />
        <ActionCard
          href="/admin/products"
          eyebrow="Catalogue"
          title="Products"
          body="Add, edit, and manage products, images, and rich descriptions without cluttering the main admin flow."
          toneClass="bg-[#EEF7F3]"
        />
        <ActionCard
          href="/admin/categories"
          eyebrow="Menu structure"
          title="Categories"
          body="Create, reorder, and tidy category groups so the storefront stays clean and easy for customers to browse."
          toneClass="bg-[#F3F0FF]"
        />
        <ActionCard
          href="/admin/settings"
          eyebrow="Branding"
          title="Settings"
          body="Start shaping the business identity, wording, colours, and logo that will flow through this tenant’s storefront and admin."
          toneClass="bg-[#FFF8DD]"
        />
      </div>
    </AdminShell>
  );
}
