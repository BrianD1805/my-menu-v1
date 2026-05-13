import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CreateOrderInput } from "@/lib/types";
import { resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { buildWhatsAppAppUrl, buildWhatsAppOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { enqueueNotificationEvent } from "@/lib/notifications";
import { sendAdminPushForTenant } from "@/lib/web-push";
import { calculateTenantTrialState, TRIAL_EXPIRY_CUSTOMER_MESSAGE } from "@/lib/trial";
import { getStorefrontPaymentOption } from "@/lib/storefront-payment-options";
import { createTenantStripeOrderCheckoutIntent } from "@/lib/storefront-stripe";
import { createTenantYocoOrderCheckoutIntent } from "@/lib/storefront-yoco";

export async function POST(req: Request) {
  let savedCustomerAccountIdForResponse: string | null = null;
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
    const submittedTenantId = body.tenantId?.trim() || null;

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


    const trialState = calculateTenantTrialState(tenant);
    if (trialState.checkoutBlocked) {
      return NextResponse.json(
        { error: TRIAL_EXPIRY_CUSTOMER_MESSAGE, trialExpired: true },
        { status: 402 }
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

    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId);
      const stockEnabled = Boolean(product?.stock_enabled);
      const stockQuantity = Math.max(0, Number(product?.stock_quantity || 0));
      if (stockEnabled && item.quantity > stockQuantity) {
        return NextResponse.json(
          { error: `${product?.name || "This product"} only has ${stockQuantity} in stock.` },
          { status: 409 }
        );
      }
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

    const settings = await getTenantSettings(tenant.id);
    const selectedPayment = getStorefrontPaymentOption(settings, body.orderType, body.paymentProvider);

    if (!selectedPayment) {
      return NextResponse.json(
        { error: "No payment method is currently available for this order type" },
        { status: 400 }
      );
    }

    if (selectedPayment.online && !["stripe", "yoco"].includes(selectedPayment.id)) {
      return NextResponse.json(
        { error: "This online payment provider is not live for this store yet. Please choose another payment option." },
        { status: 400 }
      );
    }

    if (selectedPayment.id === "stripe") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantStripeOrderCheckoutIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId: body.customerAccountId?.trim() || null,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItems,
          total,
          currencyCode: branding.currencyCode || settings?.currency_code || "GBP",
          paymentMethodLabel: selectedPayment.label,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId: body.customerAccountId?.trim() || null,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: "checkout_started",
          stripeCheckoutUrl: checkoutIntent.url,
          stripeCheckoutSessionId: checkoutIntent.sessionId,
        });
      } catch (stripeError) {
        const message = stripeError instanceof Error ? stripeError.message : "Stripe checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }


    if (selectedPayment.id === "yoco") {
      const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
      try {
        const checkoutIntent = await createTenantYocoOrderCheckoutIntent({
          req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: branding.displayName,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAccountId: body.customerAccountId?.trim() || null,
          customerAddress: body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
          orderType: body.orderType,
          notes: body.notes?.trim() || null,
          items: orderItems,
          total,
          currencyCode: branding.currencyCode || settings?.currency_code || "ZAR",
          paymentMethodLabel: selectedPayment.label,
        });

        return NextResponse.json({
          ok: true,
          orderId: null,
          checkoutId: checkoutIntent.checkoutId,
          customerAccountId: body.customerAccountId?.trim() || null,
          paymentProvider: selectedPayment.id,
          paymentMethodLabel: selectedPayment.label,
          paymentStatus: "checkout_started",
          yocoCheckoutUrl: checkoutIntent.url,
          yocoCheckoutId: checkoutIntent.yocoCheckoutId,
        });
      } catch (yocoError) {
        const message = yocoError instanceof Error ? yocoError.message : "Yoco checkout could not be started.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        customer_name: body.customerName.trim(),
        customer_phone: body.customerPhone.trim(),
        customer_account_id: body.customerAccountId?.trim() || null,
        customer_address:
          body.orderType === "collection" ? null : body.customerAddress?.trim() || null,
        order_type: body.orderType,
        status: "new",
        total,
        notes: body.notes?.trim() || null,
        payment_provider: selectedPayment.id,
        payment_method_label: selectedPayment.label,
        payment_status: selectedPayment.online ? "pending_online_payment" : "pay_on_fulfilment",
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

    // Ver-0.209: lightweight analytics. Never block order creation if analytics is unavailable.
    db.from("analytics_events").insert({
      tenant_id: tenant.id,
      scope: "tenant_storefront",
      event_type: "order_created",
      host: req.headers.get("x-forwarded-host") || req.headers.get("host") || null,
      page_path: "/checkout",
      order_id: order.id,
      anonymous_session_id: body.customerAccountId?.trim() || null,
      metadata: { orderType: body.orderType, paymentProvider: selectedPayment.id, total },
    }).then(undefined, () => undefined);

    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.stock_enabled) continue;

      const nextStock = Math.max(0, Number(product.stock_quantity || 0) - item.quantity);
      const { error: stockError } = await db
        .from("products")
        .update({ stock_quantity: nextStock })
        .eq("id", product.id)
        .eq("tenant_id", tenant.id);

      if (stockError) {
        console.error("Failed to reduce product stock", stockError);
      }
    }

    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

    const message = buildWhatsAppOrderMessage({
      tenantName: branding.displayName,
      order,
      ...branding,
      items: orderItems.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    });

    const whatsappUrl = buildWhatsAppUrl(tenant.whatsapp_number, message);
    const whatsappAppUrl = buildWhatsAppAppUrl(tenant.whatsapp_number, message);

    await db.from("orders").update({ whatsapp_message: message }).eq("id", order.id).eq("tenant_id", tenant.id);

    const stripeCheckoutUrl: string | null = null;
    const stripeCheckoutSessionId: string | null = null;

    await Promise.allSettled([
      enqueueNotificationEvent({
        tenantId: tenant.id,
        orderId: order.id,
        audience: "admin",
        eventType: "new_order",
        title: "New order received",
        body: selectedPayment.online ? `${body.customerName.trim()} started a Stripe payment for a ${body.orderType} order.` : `${body.customerName.trim()} placed a new ${body.orderType} order.`,
        payload: { orderId: order.id, route: "/admin/orders" },
      }),
      enqueueNotificationEvent({
        tenantId: tenant.id,
        orderId: order.id,
        audience: "customer",
        eventType: "order_received",
        title: "Order received",
        body: selectedPayment.online ? "Your order has been received and is waiting for secure card payment." : "Your order has been received and is waiting for confirmation.",
        payload: { orderId: order.id, status: "new" },
      }),
      sendAdminPushForTenant(tenant.id, {
        title: "New order received",
        body: selectedPayment.online ? `${body.customerName.trim()} started a Stripe payment for a ${body.orderType} order.` : `${body.customerName.trim()} placed a new ${body.orderType} order.`,
        url: "/admin/orders",
        tag: `orduva-order-${order.id}`,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      customerAccountId: body.customerAccountId?.trim() || null,
      paymentProvider: selectedPayment.id,
      paymentMethodLabel: selectedPayment.label,
      paymentStatus: selectedPayment.online ? "pending_online_payment" : "pay_on_fulfilment",
      stripeCheckoutUrl,
      stripeCheckoutSessionId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
