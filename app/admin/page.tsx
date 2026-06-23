import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import type { MoneyFormatSettings } from "@/lib/money";
import AdminSalesOverview from "@/components/admin/AdminSalesOverview";


type SalesPeriodKey = "daily" | "weekly" | "monthly";

type SalesMetric = {
  key: SalesPeriodKey;
  label: string;
  rangeLabel: string;
  totalLabel: string;
  orderCount: number;
};

type SalesOrderRow = {
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

function startOfToday(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfToday(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfDay(date: Date) {
  const end = startOfToday(date);
  end.setDate(end.getDate() + 1);
  return end;
}

function formatRangeLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const adjustedEnd = new Date(end.getTime() - 1);
  if (formatter.format(start) === formatter.format(adjustedEnd)) return formatter.format(start);
  return `${formatter.format(start)} – ${formatter.format(adjustedEnd)}`;
}

function isSalesOrder(order: SalesOrderRow) {
  const status = String(order.status || "").toLowerCase();
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  if (["cancelled", "canceled", "refunded"].includes(status)) return false;
  if (["failed", "cancelled", "canceled", "refunded"].includes(paymentStatus)) return false;
  return true;
}

function summariseOrders(orders: SalesOrderRow[], start: Date, end: Date) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const rows = orders.filter((order) => {
    const createdTime = new Date(order.created_at).getTime();
    return Number.isFinite(createdTime) && createdTime >= startTime && createdTime < endTime && isSalesOrder(order);
  });
  return {
    orderCount: rows.length,
    total: rows.reduce((sum, order) => sum + Number(order.total || 0), 0),
  };
}

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
      className={`group rounded-[26px] border border-[#DCE5E1] p-5 transition hover:border-[#0F766E]/35 hover:bg-[#EAFBF5] ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B85A35]">{eyebrow}</p>
      <div className="mt-3 flex min-h-[150px] flex-col justify-between gap-5 sm:min-h-[164px]">
        <div>
          <h2 className="text-xl font-bold text-[#1F2328]">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#4F535A]">{body}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCE5E1] bg-white/85 px-4 py-2 text-sm font-extrabold text-[#111827] transition group-hover:border-[#0F766E]/45 group-hover:bg-[#0F766E] group-hover:text-white">
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

  const now = new Date();
  const todayStart = startOfToday(now);
  const tomorrowStart = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const earliestSalesStart = weekStart.getTime() < monthStart.getTime() ? weekStart : monthStart;

  const { data: salesOrders } = await db
    .from("orders")
    .select("total,status,payment_status,created_at")
    .eq("tenant_id", tenant.id)
    .gte("created_at", earliestSalesStart.toISOString());

  const orderRows = (salesOrders || []) as SalesOrderRow[];
  const daily = summariseOrders(orderRows, todayStart, tomorrowStart);
  const weekly = summariseOrders(orderRows, weekStart, tomorrowStart);
  const monthly = summariseOrders(orderRows, monthStart, tomorrowStart);

  const moneySettings: MoneyFormatSettings = {
    currencyName: settings?.currency_name,
    currencyCode: settings?.currency_code,
    currencySymbol: settings?.currency_symbol,
    currencyDisplayMode: settings?.currency_display_mode as MoneyFormatSettings["currencyDisplayMode"],
    currencySymbolPosition: settings?.currency_symbol_position as MoneyFormatSettings["currencySymbolPosition"],
    currencyDecimalPlaces: settings?.currency_decimal_places,
    currencyUseThousandsSeparator: settings?.currency_use_thousands_separator,
    currencyDecimalSeparator: settings?.currency_decimal_separator,
    currencyThousandsSeparator: settings?.currency_thousands_separator,
    currencySuffix: settings?.currency_suffix,
  };

  const salesMetrics: SalesMetric[] = [
    {
      key: "daily",
      label: "Daily",
      rangeLabel: formatRangeLabel(todayStart, tomorrowStart),
      totalLabel: formatMoney(daily.total, moneySettings),
      orderCount: daily.orderCount,
    },
    {
      key: "weekly",
      label: "Weekly",
      rangeLabel: formatRangeLabel(weekStart, tomorrowStart),
      totalLabel: formatMoney(weekly.total, moneySettings),
      orderCount: weekly.orderCount,
    },
    {
      key: "monthly",
      label: "Monthly",
      rangeLabel: formatRangeLabel(monthStart, tomorrowStart),
      totalLabel: formatMoney(monthly.total, moneySettings),
      orderCount: monthly.orderCount,
    },
  ];

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
      <div className="space-y-5">
        <AdminSalesOverview metrics={salesMetrics} />

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
      </div>
    </AdminShell>
  );
}
