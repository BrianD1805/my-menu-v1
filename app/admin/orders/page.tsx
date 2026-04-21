import AdminShell from "@/components/admin/AdminShell";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import LiveOrdersRefresh from "@/components/admin/LiveOrdersRefresh";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { getTenantSettings, buildTenantBranding } from "@/lib/tenant-settings";
import { db } from "@/lib/db";

type OrderRow = {
  id: string;
  status: string;
  total: number | string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  order_type: string | null;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  product_name: string | null;
};

type StatusFilter = "all" | "new" | "accepted" | "preparing" | "ready" | "completed";

function formatMoney(amount: number, branding: ReturnType<typeof buildTenantBranding>) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: branding.currencyCode || "GBP",
    minimumFractionDigits: branding.currencyDecimalPlaces ?? 2,
    maximumFractionDigits: branding.currencyDecimalPlaces ?? 2,
  }).format(amount);
}

function labelForStatus(status: string) {
  switch (status) {
    case "ready":
      return "Out for delivery";
    case "completed":
      return "Delivered";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusCardClasses(tone: StatusFilter) {
  switch (tone) {
    case "new":
      return "border-amber-200 bg-amber-50/70 text-amber-900";
    case "accepted":
      return "border-blue-200 bg-blue-50/70 text-blue-900";
    case "preparing":
      return "border-yellow-200 bg-yellow-50/70 text-yellow-900";
    case "ready":
      return "border-indigo-200 bg-indigo-50/70 text-indigo-900";
    case "completed":
      return "border-emerald-200 bg-emerald-50/70 text-emerald-900";
    default:
      return "border-black/5 bg-white text-slate-900";
  }
}

function StatusSummaryCard({
  label,
  value,
  href,
  tone = "all",
  active = false,
}: {
  label: string;
  value: number;
  href: string;
  tone?: StatusFilter;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group rounded-[24px] border p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)] ${statusCardClasses(tone)} ${active ? "ring-2 ring-slate-900/10" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <span className="rounded-2xl border border-current/20 bg-white/70 px-3 py-1.5 text-xs font-semibold transition group-hover:bg-white">
          Open
        </span>
      </div>
    </a>
  );
}

function buildItemsSummary(items: OrderItemRow[]) {
  return items.map((item) => `${item.quantity} × ${item.product_name || "Item"}`).join(", ");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) || {};

  const activeFilter = (["all", "new", "accepted", "preparing", "ready", "completed"].includes(
    resolvedSearchParams?.status || ""
  )
    ? resolvedSearchParams?.status
    : "all") as StatusFilter;

  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  const { data: orders } = await db
    .from("orders")
    .select("id,status,total,customer_name,customer_phone,notes,order_type,created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const sortedOrders: OrderRow[] = [...((orders || []) as OrderRow[])].sort((a, b) => {
    const rank = (status: string) => {
      if (status === "new") return 0;
      if (status === "accepted") return 1;
      if (status === "preparing") return 2;
      if (status === "ready") return 3;
      if (status === "completed") return 5;
      return 4;
    };

    const aRank = rank(a.status);
    const bRank = rank(b.status);
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const orderIds = sortedOrders.map((order) => order.id);

  const { data: orderItems } =
    orderIds.length > 0
      ? await db
          .from("order_items")
          .select("order_id,quantity,unit_price,line_total,product_name")
          .in("order_id", orderIds)
      : { data: [] as OrderItemRow[] };

  const itemsByOrder = (orderItems || []).reduce<Record<string, OrderItemRow[]>>((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = [];
    acc[item.order_id].push(item as OrderItemRow);
    return acc;
  }, {});

  const counts = sortedOrders.reduce(
    (acc, order) => {
      acc.total += 1;
      if (order.status === "new") acc.new += 1;
      if (order.status === "accepted") acc.accepted += 1;
      if (order.status === "preparing") acc.preparing += 1;
      if (order.status === "ready") acc.ready += 1;
      if (order.status === "completed") acc.completed += 1;
      return acc;
    },
    { total: 0, new: 0, accepted: 0, preparing: 0, ready: 0, completed: 0 }
  );

  const displayedOrders = sortedOrders.filter((order) => {
    if (activeFilter === "all") {
      return order.status !== "completed";
    }
    return order.status === activeFilter;
  });

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="orders"
      title="Orders"
      description="Open each status card to jump straight into the orders that need attention. Delivered orders are treated as finalised and counted in totals."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatusSummaryCard label="Total orders" value={counts.total} href="/admin/orders?status=all" tone="all" active={activeFilter === "all"} />
          <StatusSummaryCard label="New" value={counts.new} href="/admin/orders?status=new" tone="new" active={activeFilter === "new"} />
          <StatusSummaryCard label="Accepted" value={counts.accepted} href="/admin/orders?status=accepted" tone="accepted" active={activeFilter === "accepted"} />
          <StatusSummaryCard label="Preparing" value={counts.preparing} href="/admin/orders?status=preparing" tone="preparing" active={activeFilter === "preparing"} />
          <StatusSummaryCard label="Out for delivery" value={counts.ready} href="/admin/orders?status=ready" tone="ready" active={activeFilter === "ready"} />
          <StatusSummaryCard label="Delivered" value={counts.completed} href="/admin/orders?status=completed" tone="completed" active={activeFilter === "completed"} />
        </div>

        <LiveOrdersRefresh currentNewCount={counts.new} />

        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {activeFilter === "all"
            ? "Showing live active orders. Delivered / finalised orders are counted in Total orders and shown when you open the Delivered card."
            : `Showing ${labelForStatus(activeFilter)} orders only.`}
        </div>

        <div className="space-y-4">
          {!displayedOrders.length ? <p>No orders found for this filter.</p> : null}

          {displayedOrders.map((order) => {
            const items = itemsByOrder[order.id] || [];
            const isNew = order.status === "new";
            const orderSummary = items.length ? buildItemsSummary(items) : "Order contents not available yet.";

            return (
              <div
                key={order.id}
                className={`rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
                  isNew ? "border-amber-200 bg-amber-50/40 ring-1 ring-amber-100" : "border-black/5 bg-white"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">Order {order.id}</p>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {labelForStatus(order.status)}
                      </span>
                      {isNew ? (
                        <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                          Needs attention
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.order_type || "Order"} · {formatMoney(Number(order.total), branding)}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-700">
                      {order.customer_name || "Walk-in / Guest"}
                      {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Order summary</p>
                      <p className="mt-1 font-medium text-slate-800">{orderSummary}</p>
                    </div>
                    {order.notes ? <p className="text-sm text-gray-600">Notes: {order.notes}</p> : null}
                  </div>

                  <div className="w-full max-w-[320px]">
                    <OrderStatusForm orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>

                {items.length ? (
                  <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order items</p>
                    <div className="mt-3 space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={`${order.id}-${idx}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                        >
                          <span className="font-medium text-slate-800">
                            {item.quantity} × {item.product_name || "Item"}
                          </span>
                          <span className="text-slate-600">{formatMoney(Number(item.line_total), branding)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
