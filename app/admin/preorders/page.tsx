import AdminShell from "@/components/admin/AdminShell";
import PreOrderManager from "@/components/admin/PreOrderManager";
import { requireAdminPageUser } from "@/lib/admin-auth";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";
import { db } from "@/lib/db";
import { normalizePreorderDepositPercent } from "@/lib/preorders";

function dedupePreOrders(orders: any[]) {
  const seen = new Set<string>();
  return orders.filter((order) => {
    const key = String(order.payment_checkout_session_id || order.payment_intent_id || order.payment_reference || order.id || "").trim();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function AdminPreOrdersPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);
  const { data: orders } = await db
    .from("orders")
    .select("id,customer_name,customer_phone,status,total,created_at,payment_checkout_session_id,payment_intent_id,payment_reference,preorder_status,preorder_deposit_percent,preorder_deposit_amount,preorder_balance_amount,preorder_balance_payment_status")
    .eq("tenant_id", tenant.id)
    .in("order_flow", ["preorder", "mixed"])
    .order("created_at", { ascending: false });

  const orderRows = dedupePreOrders((orders || []) as any);
  const orderIds = orderRows.map((order: any) => order.id).filter(Boolean);
  const { data: orderItems } = orderIds.length
    ? await db
        .from("order_items")
        .select("order_id,product_name,quantity,is_preorder")
        .in("order_id", orderIds)
        .eq("is_preorder", true)
    : { data: [] as any[] };

  const itemsByOrder = ((orderItems || []) as any[]).reduce<Record<string, string[]>>((acc, item) => {
    if (!item.order_id) return acc;
    if (!acc[item.order_id]) acc[item.order_id] = [];
    const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
    acc[item.order_id].push(`${item.product_name || "Pre-order item"}${quantity > 1 ? ` × ${quantity}` : ""}`);
    return acc;
  }, {});

  const preOrdersWithProducts = orderRows.map((order: any) => ({
    ...order,
    product_names: (itemsByOrder[order.id] || []).join(", "),
  }));

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="preorders"
      title="Pre-orders"
      description="Control pre-order deposits, stock-arrival pushes and customer balance collection. Stock is only deducted after the balance is marked as paid."
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
    >
      <PreOrderManager
        orders={preOrdersWithProducts as any}
        depositPercent={normalizePreorderDepositPercent((settings as any)?.preorder_deposit_percent ?? 25)}
        moneySettings={branding}
      />
    </AdminShell>
  );
}
