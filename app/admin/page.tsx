import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
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
      className="group rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{body}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition group-hover:border-slate-900 group-hover:text-slate-900">
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

  const [{ count: orderCount }, { count: productCount }, { count: categoryCount }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("categories").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
  ]);

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="home"
      title={`Welcome back, ${user.full_name || user.email}`}
      description="Choose where you want to work today — orders, products, categories, settings, or a quick storefront check. Everything below belongs to this tenant only."
      logoUrl={branding.logoUrl}
      accentColor={branding.accentColor}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Orders" value={String(orderCount || 0)} hint="All orders shown here belong to this tenant only." />
        <StatCard label="Products" value={String(productCount || 0)} hint="Manage the live product catalogue for this business." />
        <StatCard label="Categories" value={String(categoryCount || 0)} hint="Organise the menu structure and display order." />
      </div>

      <div className="mt-6 grid gap-5">
        <ActionCard
          href="/admin/orders"
          eyebrow="Operations"
          title="Orders"
          body="Open today’s order management view, update statuses, and keep customer messaging focused in one place."
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
