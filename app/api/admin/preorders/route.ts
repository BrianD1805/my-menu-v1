import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendCustomerPushForOrderWithFallback } from "@/lib/web-push";

async function reducePreOrderStock(tenantId: string, orderId: string) {
  const { data: items, error } = await db
    .from("order_items")
    .select("product_id,quantity,variant_id,is_preorder")
    .eq("order_id", orderId)
    .eq("is_preorder", true);
  if (error) throw new Error("Could not load pre-order items for stock update.");

  for (const item of items || []) {
    if (!item.product_id) continue;
    const { data: product, error: productError } = await db
      .from("products")
      .select("id,stock_enabled,stock_quantity,product_variants")
      .eq("tenant_id", tenantId)
      .eq("id", item.product_id)
      .maybeSingle();
    if (productError || !product) continue;
    const qty = Math.max(0, Math.floor(Number(item.quantity || 0)));
    if (item.variant_id) {
      const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
      const nextVariants = variants.map((variant: any) => {
        if (variant?.id !== item.variant_id || variant?.stockEnabled !== true) return variant;
        const current = Math.max(0, Math.floor(Number(variant.stockQuantity || 0)));
        return { ...variant, stockQuantity: Math.max(0, current - qty) };
      });
      await db.from("products").update({ product_variants: nextVariants }).eq("tenant_id", tenantId).eq("id", product.id);
      continue;
    }
    if (product.stock_enabled !== true) continue;
    const current = Math.max(0, Math.floor(Number(product.stock_quantity || 0)));
    await db.from("products").update({ stock_quantity: Math.max(0, current - qty) }).eq("tenant_id", tenantId).eq("id", product.id);
  }
}

export async function POST(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    const action = String(body?.action || "").trim();
    if (action === "settings") {
      const depositPercent = Math.min(95, Math.max(1, Number(body?.depositPercent || 25)));
      if (!Number.isFinite(depositPercent)) return NextResponse.json({ error: "Invalid deposit percent" }, { status: 400 });
      const { error } = await db
        .from("tenant_settings")
        .upsert({ tenant_id: tenant.id, preorder_deposit_percent: Number(depositPercent.toFixed(2)), preorders_enabled: true }, { onConflict: "tenant_id" });
      if (error) return NextResponse.json({ error: "Could not save deposit setting" }, { status: 500 });
      return NextResponse.json({ ok: true, depositPercent: Number(depositPercent.toFixed(2)) });
    }
    if (!orderId || !["stock_arrived", "balance_paid"].includes(action)) {
      return NextResponse.json({ error: "Missing order/action" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await db
      .from("orders")
      .select("id,tenant_id,customer_name,preorder_balance_amount,preorder_balance_payment_status")
      .eq("id", orderId)
      .eq("tenant_id", tenant.id)
      .in("order_flow", ["preorder", "mixed"])
      .maybeSingle();
    if (existingError || !existing) return NextResponse.json({ error: "Pre-order not found" }, { status: 404 });

    if (action === "stock_arrived") {
      const { data: order, error } = await db
        .from("orders")
        .update({
          preorder_status: "balance_requested",
          preorder_balance_payment_status: "requested",
          preorder_balance_requested_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("tenant_id", tenant.id)
        .select("id,preorder_status,preorder_balance_payment_status,preorder_balance_requested_at")
        .single();
      if (error || !order) return NextResponse.json({ error: "Could not update pre-order" }, { status: 500 });

      const balanceLink = `/preorder/balance/${orderId}`;
      await enqueueNotificationEvent({
        tenantId: tenant.id,
        orderId,
        audience: "customer",
        eventType: "preorder_balance_requested",
        title: "Your pre-order is ready",
        body: "Stock has arrived. Please pay your balance so the order can be dispatched.",
        payload: { orderId, url: balanceLink, balanceAmount: Number(existing.preorder_balance_amount || 0) },
      });
      await sendCustomerPushForOrderWithFallback(tenant.id, orderId, {
        title: "Your pre-order is ready",
        body: "Stock has arrived. Tap to pay your balance.",
        url: balanceLink,
        tag: `orduva-preorder-balance-${orderId}`,
      });
      return NextResponse.json({ ok: true, order });
    }

    if (existing.preorder_balance_payment_status === "paid") {
      return NextResponse.json({ ok: true, order: { id: orderId, preorder_balance_payment_status: "paid" } });
    }

    const paidAt = new Date().toISOString();
    const balanceAmount = Math.max(0, Number(existing.preorder_balance_amount || 0));

    const { error: paymentEventError } = await db
      .from("order_payment_events")
      .upsert({
        tenant_id: tenant.id,
        order_id: orderId,
        event_type: "preorder_balance_paid",
        payment_stage: "balance",
        payment_source: "tenant_admin_manual",
        payment_status: "paid",
        amount: balanceAmount,
        payment_reference: `PREORDER-BALANCE-${String(orderId).slice(0, 8).toUpperCase()}`,
        notes: "Balance marked paid in Tenant Admin Pre-orders.",
        paid_at: paidAt,
        created_at: paidAt,
        updated_at: paidAt,
      }, { onConflict: "order_id,event_type" });

    if (paymentEventError) {
      return NextResponse.json({ error: "Could not record the balance payment. Run the Ver-0.235K Supabase SQL and try again." }, { status: 500 });
    }

    await reducePreOrderStock(tenant.id, orderId);
    const { data: order, error } = await db
      .from("orders")
      .update({
        preorder_status: "ready_for_dispatch",
        preorder_balance_payment_status: "paid",
        preorder_balance_paid_at: paidAt,
        status: "ready",
      })
      .eq("id", orderId)
      .eq("tenant_id", tenant.id)
      .select("id,status,preorder_status,preorder_balance_payment_status,preorder_balance_paid_at")
      .single();
    if (error || !order) return NextResponse.json({ error: "Could not mark balance paid" }, { status: 500 });

    await enqueueNotificationEvent({
      tenantId: tenant.id,
      orderId,
      audience: "customer",
      eventType: "preorder_balance_paid",
      title: "Balance received",
      body: "Your pre-order balance has been received and the order is ready for dispatch.",
      payload: { orderId, status: "ready", balanceAmount },
    });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pre-order action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
