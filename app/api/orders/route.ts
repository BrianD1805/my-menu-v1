import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CreateOrderInput } from "@/lib/types";
import { resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderInput;
    const requestTenantSlug = resolveTenantSlugFromRequest(req);

    if (!requestTenantSlug) {
      return NextResponse.json({ error: "Tenant could not be resolved from request" }, { status: 400 });
    }

    if (!body.tenantSlug?.trim()) {
      return NextResponse.json({ error: "Missing tenant slug" }, { status: 400 });
    }

    const submittedTenantSlug = body.tenantSlug.trim();

    if (submittedTenantSlug !== requestTenantSlug) {
      return NextResponse.json(
        { error: "Order tenant mismatch" },
        { status: 400 }
      );
    }

    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: "Missing customer name" }, { status: 400 });
    }

    if (!body.customerPhone?.trim()) {
      return NextResponse.json({ error: "Missing customer phone" }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No order items provided" }, { status: 400 });
    }

    if (body.items.some((item) => !item.productId || item.quantity < 1)) {
      return NextResponse.json({ error: "Invalid order item payload" }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("*")
      .eq("slug", requestTenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!tenant.whatsapp_number) {
      return NextResponse.json(
        { error: "Tenant WhatsApp number not configured" },
        { status: 400 }
      );
    }

    const productIds = body.items.map((i) => i.productId);

    const { data: products, error: productsError } = await db
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    if (productsError || !products?.length) {
      return NextResponse.json({ error: "Products not found" }, { status: 400 });
    }

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products do not belong to this tenant or are inactive" },
        { status: 400 }
      );
    }

    let total = 0;

    const orderItems = body.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error(`Product missing: ${item.productId}`);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      total += lineTotal;

      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        customer_name: body.customerName.trim(),
        customer_phone: body.customerPhone.trim(),
        customer_address:
          body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
        order_type: body.orderType,
        status: "new",
        total,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await db.from("order_items").insert(orderItemsWithOrderId);

    if (itemsError) {
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(tenant.name, settings);

    const message = buildWhatsAppOrderMessage({
      tenantName: branding.displayName,
      order,
      currencySymbol: branding.currencySymbol,
      items: orderItems.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    });

    const whatsappUrl = buildWhatsAppUrl(tenant.whatsapp_number, message);

    await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      whatsappUrl,
      whatsappMessage: message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
