import OrderStatusForm from "@/components/admin/OrderStatusForm";
import StatusBadge from "@/components/admin/StatusBadge";
import WhatsAppButton from "@/components/admin/WhatsAppButton";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant";

export default async function AdminOrdersPage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);

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
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Admin Orders</h1>
      <p className="mb-6 text-gray-600">Tenant: {tenant.name}</p>

      <div className="space-y-4">
        {orders?.map((order) => {
          const items = (orderItems || []).filter((item) => item.order_id === order.id);

          return (
            <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">Order {order.id}</p>
                  <p className="text-sm text-gray-600">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.order_type} · £{Number(order.total).toFixed(2)}
                  </p>
                  <p className="mt-2">
                    <StatusBadge status={order.status} />
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <WhatsAppButton phone={tenant.whatsapp_number} message={order.whatsapp_message} />
                  <OrderStatusForm orderId={order.id} currentStatus={order.status} />
                </div>
              </div>

              {order.customer_address ? (
                <p className="mb-2 text-sm text-gray-700">Address: {order.customer_address}</p>
              ) : null}

              {order.notes ? <p className="mb-3 text-sm text-gray-700">Notes: {order.notes}</p> : null}

              <div className="mb-3 rounded-xl bg-gray-50 p-3">
                <p className="mb-2 text-sm font-semibold">Items</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        {item.quantity} × {item.product_name}
                      </span>
                      <span>£{Number(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.whatsapp_message ? (
                <details className="rounded-xl border p-3">
                  <summary className="cursor-pointer text-sm font-medium">View WhatsApp message</summary>
                  <pre className="mt-3 whitespace-pre-wrap text-sm">{order.whatsapp_message}</pre>
                </details>
              ) : null}
            </div>
          );
        })}

        {!orders?.length ? <p>No orders yet.</p> : null}
      </div>
    </main>
  );
}
