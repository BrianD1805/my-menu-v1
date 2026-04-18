import OrderStatusForm from "@/components/admin/OrderStatusForm";
import StatusBadge from "@/components/admin/StatusBadge";
import WhatsAppButton from "@/components/admin/WhatsAppButton";
import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, formatMoney, getTenantSettings } from "@/lib/tenant-settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function AdminOrdersPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.name, settings);

  const { data: orders } = await db
    .from("orders")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const orderIds = orders?.map((o) => o.id) || [];

  const { data: orderItems } =
    orderIds.length > 0
      ? await db.from("order_items").select("*").in("order_id", orderIds)
      : { data: [] };

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="orders"
      title="Admin Orders"
      logoUrl={branding.logoUrl}
      accentColor={branding.accentColor}
      description="Manage incoming orders for this tenant only. Update status, open WhatsApp when needed, and keep service moving cleanly."
    >
      <div className="space-y-4">
        {orders?.map((order) => {
          const items = (orderItems || []).filter((item) => item.order_id === order.id);
          const whatsappUrl =
            tenant.whatsapp_number && order.whatsapp_message
              ? buildWhatsAppUrl(tenant.whatsapp_number, order.whatsapp_message)
              : null;

          return (
            <div key={order.id} className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">Order {order.id}</p>
                  <p className="text-sm text-gray-600">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.order_type} · {formatMoney(Number(order.total), branding.currencySymbol)}
                  </p>
                  <p className="mt-2">
                    <StatusBadge status={order.status} />
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <WhatsAppButton url={whatsappUrl} />
                  <OrderStatusForm orderId={order.id} currentStatus={order.status} />
                </div>
              </div>

              {order.customer_address ? (
                <p className="mb-2 text-sm text-gray-700">Address: {order.customer_address}</p>
              ) : null}

              {order.notes ? <p className="mb-3 text-sm text-gray-700">Notes: {order.notes}</p> : null}

              <div className="mb-3 rounded-[22px] bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold">Items</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        {item.quantity} × {item.product_name}
                      </span>
                      <span>{formatMoney(Number(item.line_total), branding.currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.whatsapp_message ? (
                <details className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-medium">View WhatsApp message</summary>
                  <pre className="mt-3 whitespace-pre-wrap text-sm">{order.whatsapp_message}</pre>
                </details>
              ) : null}
            </div>
          );
        })}

        {!orders?.length ? <p>No orders yet for this tenant.</p> : null}
      </div>
    </AdminShell>
  );
}
