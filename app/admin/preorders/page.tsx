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
        orders={dedupePreOrders((orders || []) as any)}
        depositPercent={normalizePreorderDepositPercent((settings as any)?.preorder_deposit_percent ?? 25)}
        moneySettings={branding}
      />
    </AdminShell>
  );
}
