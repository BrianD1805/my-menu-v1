import AdminShell from "@/components/admin/AdminShell";
import LiveOrdersRefresh from "@/components/admin/LiveOrdersRefresh";
import OrderQueuePopup from "@/components/admin/OrderQueuePopup";
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

function statusRank(status: string) {
  if (status === "new") return 0;
  if (status === "accepted") return 1;
  if (status === "preparing") return 2;
  if (status === "ready") return 3;
  if (status === "completed") return 5;
  return 4;
}

function mapOrdersForPopup(
  orders: OrderRow[],
  itemsByOrder: Record<string, OrderItemRow[]>
) {
  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    total: Number(order.total),
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    notes: order.notes,
    orderType: order.order_type,
    createdAt: order.created_at,
    items: (itemsByOrder[order.id] || []).map((item) => ({
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
      productName: item.product_name,
    })),
  }));
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
    const aRank = statusRank(a.status);
    const bRank = statusRank(b.status);
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

  const newOrders = sortedOrders.filter((order) => order.status === "new");
  const acceptedOrders = sortedOrders.filter((order) => order.status === "accepted");
  const preparingOrders = sortedOrders.filter((order) => order.status === "preparing");
  const readyOrders = sortedOrders.filter((order) => order.status === "ready");
  const deliveredOrders = sortedOrders.filter((order) => order.status === "completed");

  const counts = {
    total: sortedOrders.length,
    new: newOrders.length,
    accepted: acceptedOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
    completed: deliveredOrders.length,
  };

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="orders"
      title="Orders"
      description="Tap a status card to open that live order queue directly in a popup. No scrolling hunt, just open the queue you want and work through it."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <OrderQueuePopup
            label="New"
            count={counts.new}
            orders={mapOrdersForPopup(newOrders, itemsByOrder)}
            currencyCode={branding.currencyCode || "GBP"}
            decimals={branding.currencyDecimalPlaces ?? 2}
          />
          <OrderQueuePopup
            label="Accepted"
            count={counts.accepted}
            orders={mapOrdersForPopup(acceptedOrders, itemsByOrder)}
            currencyCode={branding.currencyCode || "GBP"}
            decimals={branding.currencyDecimalPlaces ?? 2}
          />
          <OrderQueuePopup
            label="Preparing"
            count={counts.preparing}
            orders={mapOrdersForPopup(preparingOrders, itemsByOrder)}
            currencyCode={branding.currencyCode || "GBP"}
            decimals={branding.currencyDecimalPlaces ?? 2}
          />
          <OrderQueuePopup
            label="Out for delivery"
            count={counts.ready}
            orders={mapOrdersForPopup(readyOrders, itemsByOrder)}
            currencyCode={branding.currencyCode || "GBP"}
            decimals={branding.currencyDecimalPlaces ?? 2}
          />
          <OrderQueuePopup
            label="Delivered"
            count={counts.completed}
            orders={mapOrdersForPopup(deliveredOrders, itemsByOrder)}
            currencyCode={branding.currencyCode || "GBP"}
            decimals={branding.currencyDecimalPlaces ?? 2}
          />
          <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{counts.total}</p>
            <p className="mt-1 text-sm text-slate-600">Includes delivered / finalised orders.</p>
          </div>
        </div>

        <LiveOrdersRefresh currentNewCount={counts.new} />

        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Status cards now open the working order queue directly in a popup. Delivered orders remain counted in Total orders and can be opened from the Delivered card.
        </div>
      </div>
    </AdminShell>
  );
}
