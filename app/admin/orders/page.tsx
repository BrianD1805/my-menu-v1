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
  price: number | string;
  products: {
    name: string | null;
  } | null;
};

function formatMoney(amount: number, branding: ReturnType<typeof buildTenantBranding>) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: branding.currencyCode || "GBP",
    minimumFractionDigits: branding.currencyDecimalPlaces ?? 2,
    maximumFractionDigits: branding.currencyDecimalPlaces ?? 2,
  }).format(amount);
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "new" | "accepted" | "preparing" | "done";
}) {
  const toneClass =
    tone === "new"
      ? "border-amber-200 bg-amber-50/70 text-amber-900"
      : tone === "accepted"
      ? "border-blue-200 bg-blue-50/70 text-blue-900"
      : tone === "preparing"
      ? "border-yellow-200 bg-yellow-50/70 text-yellow-900"
      : tone === "done"
      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
      : "border-black/5 bg-white text-slate-900";

  const labelClass =
    tone === "new"
      ? "text-amber-700"
      : tone === "accepted"
      ? "text-blue-700"
      : tone === "preparing"
      ? "text-yellow-700"
      : tone === "done"
      ? "text-emerald-700"
      : "text-slate-500";

  return (
    <div className={`rounded-[24px] border p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] ${toneClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default async function AdminOrdersPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  const { data: orders } = await db
    .from("orders")
    .select("id,status,total,customer_name,customer_phone,notes,order_type,created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const sortedOrders: OrderRow[] = [...((orders || []) as OrderRow[])].sort((a, b) => {
    const aRank = a.status === "new" ? 0 : 1;
    const bRank = b.status === "new" ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const orderIds = sortedOrders.map((order) => order.id);

  const { data: orderItems } =
    orderIds.length > 0
      ? await db
          .from("order_items")
          .select("order_id,quantity,price,products(name)")
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
      if (order.status === "ready" || order.status === "completed") acc.done += 1;
      return acc;
    },
    { total: 0, new: 0, accepted: 0, preparing: 0, done: 0 }
  );

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="orders"
      title="Orders"
      description="Monitor new orders, update statuses, and keep track of live order activity."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Total" value={counts.total} />
          <SummaryCard label="New" value={counts.new} tone="new" />
          <SummaryCard label="Accepted" value={counts.accepted} tone="accepted" />
          <SummaryCard label="Preparing" value={counts.preparing} tone="preparing" />
          <SummaryCard label="Ready / Completed" value={counts.done} tone="done" />
        </div>

        <LiveOrdersRefresh />

        <p className="text-sm text-slate-600">New orders are highlighted below and counted in the amber card above. There is not a separate New Orders page.</p>

        <div className="space-y-4">
          {!sortedOrders.length ? <p>No orders yet for this tenant.</p> : null}

          {sortedOrders.map((order) => {
            const items = itemsByOrder[order.id] || [];
            const isNew = order.status === "new";

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
                            {item.quantity} × {item.products?.name || "Product"}
                          </span>
                          <span className="text-slate-600">{formatMoney(Number(item.price) * item.quantity, branding)}</span>
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
