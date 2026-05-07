import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

function StatCard({ label, value, hint, urgent }: { label: string; value: string; hint: string; urgent?: boolean }) {
  return (
    <div className={`rounded-[22px] border p-4 shadow-[0_14px_34px_rgba(14,14,16,0.05)] ${urgent ? "border-[#FF6A3D]/35 bg-[#FF6A3D]/10" : "border-[#0E0E10]/10 bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF6A3D]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#1F2328]">{value}</p>
      <p className="mt-1.5 text-sm text-[#5C5F66]">{hint}</p>
    </div>
  );
}

function ActionCard({
  href,
  eyebrow,
  title,
  body,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-[24px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_14px_34px_rgba(14,14,16,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF6A3D]/35 hover:shadow-[0_24px_60px_rgba(14,14,16,0.10)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6A3D]">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2328]">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5C5F66]">{body}</p>
        </div>
        <div className="rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-2 text-sm font-bold text-[#0E0E10] transition group-hover:border-[#FF6A3D]/45 group-hover:bg-[#FF6A3D] group-hover:text-white">
          Open
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

  const [{ count: orderCount }, { count: productCount }, { count: categoryCount }, { count: newOrderCount }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("categories").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "new"),
  ]);

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(orderCount || 0)} hint="All orders shown here belong to this tenant only." />
        <StatCard
          label="New orders"
          value={String(newOrderCount || 0)}
          hint={newOrderCount ? "These need attention now. New orders are counted here and highlighted inside Orders." : "Nothing waiting right now."}
          urgent={Boolean(newOrderCount)}
        />
        <StatCard label="Products" value={String(productCount || 0)} hint="Manage the live product catalogue for this business." />
        <StatCard label="Categories" value={String(categoryCount || 0)} hint="Organise the menu structure and display order." />
      </div>

      <div className="mt-5 grid gap-4">
        <ActionCard
          href="/admin/orders"
          eyebrow="Operations"
          title="Orders"
          body="Open the live orders view, spot new orders quickly, update statuses, and keep customer messaging focused in one place."
        />
        <ActionCard
          href="/admin/products"
          eyebrow="Catalogue"
          title="Products"
          body="Add, edit, and manage products, images, and rich descriptions without cluttering the main admin flow."
        />
        <ActionCard
          href="/admin/categories"
          eyebrow="Menu structure"
          title="Categories"
          body="Create, reorder, and tidy category groups so the storefront stays clean and easy for customers to browse."
        />
        <ActionCard
          href="/admin/settings"
          eyebrow="Branding"
          title="Settings"
          body="Start shaping the business identity, wording, colours, and logo that will flow through this tenant’s storefront and admin."
        />
      </div>
    </AdminShell>
  );
}
