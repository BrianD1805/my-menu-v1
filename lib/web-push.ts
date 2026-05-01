import webpush from "web-push";
import { db } from "@/lib/db";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

type AdminSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
};

type CustomerSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
  order_id?: string | null;
  customer_account_id?: string | null;
};

type CustomerPushResult = {
  ok: boolean;
  reason: "missing_vapid" | "query_failed" | "no_subscriptions" | "send_failed" | null;
  sent: number;
  failed: number;
  lookupSource?: "order_id" | "customer_account_id" | "customer_phone" | "customer_name" | null;
};

function hasPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );
}

function configureWebPush() {
  if (!hasPushConfig()) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim()
  );

  return true;
}

function buildSubscription(row: { endpoint: string; p256dh: string; auth: string }) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

async function logCustomerPushEvent(input: {
  tenantId: string;
  orderId: string;
  eventType: string;
  title: string;
  body: string;
  status: "sent" | "warning" | "failed";
  payload: Record<string, unknown>;
}) {
  const { error } = await db.from("notification_events").insert({
    tenant_id: input.tenantId,
    order_id: input.orderId,
    audience: "customer",
    channel: "push",
    event_type: input.eventType,
    title: input.title,
    body: input.body,
    payload: input.payload,
    status: input.status,
  });

  if (error) {
    console.error("[Orduva push] Failed to log customer notification event", error.message);
  }
}

async function linkRowsToCurrentOrder(tenantId: string, orderId: string, rows: CustomerSubscriptionRow[]) {
  const endpoints = Array.from(new Set(rows.map((row) => row.endpoint).filter(Boolean)));
  if (!endpoints.length) return;

  const { error } = await db
    .from("customer_push_subscriptions")
    .update({ order_id: orderId, updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .in("endpoint", endpoints);

  if (error) {
    console.error("[Orduva push] Failed to relink customer push subscriptions to current order", error.message);
  }
}

async function sendRows(tenantId: string, rows: CustomerSubscriptionRow[], payload: PushPayload) {
  let sent = 0;
  let failed = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.endpoint)) continue;
    seen.add(row.endpoint);

    try {
      await webpush.sendNotification(
        buildSubscription({
          endpoint: row.endpoint,
          p256dh: row.p256dh,
          auth: row.auth,
        }),
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/",
          tag: payload.tag || "orduva-customer-order-status",
          icon: payload.icon || "/orduva-notification-icon-192.png",
          badge: payload.badge || "/orduva-notification-badge-96.png",
        })
      );
      sent += 1;
    } catch (error: any) {
      failed += 1;
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await db
          .from("customer_push_subscriptions")
          .update({
            enabled: false,
            updated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId)
          .eq("endpoint", row.endpoint);
      }
    }
  }

  return { ok: sent > 0, reason: sent > 0 ? null : "send_failed" as const, sent, failed };
}

export async function sendAdminPushForTenant(tenantId: string, payload: PushPayload) {
  if (!configureWebPush()) {
    return { ok: false, reason: "missing_vapid" as const, sent: 0, failed: 0 };
  }

  const { data, error } = await db
    .from("admin_push_subscriptions")
    .select("endpoint,p256dh,auth,enabled")
    .eq("tenant_id", tenantId)
    .eq("enabled", true);

  if (error) {
    return { ok: false, reason: "query_failed" as const, sent: 0, failed: 0 };
  }

  if (!data?.length) {
    await db.from("notification_events").insert({
      tenant_id: tenantId,
      audience: "admin",
      channel: "in_app",
      event_type: "admin_push_no_enabled_devices",
      title: "Admin push not active",
      body: "A new-order admin push could not be sent because no enabled admin push devices were found for this tenant.",
      payload: { route: "/admin", action: "enable_admin_push" },
      status: "warning",
    });

    return { ok: false, reason: "no_subscriptions" as const, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of data as AdminSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        buildSubscription(row),
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/admin/orders",
          tag: payload.tag || "orduva-admin-push",
          icon: payload.icon || "/orduva-notification-icon-192.png",
          badge: payload.badge || "/orduva-notification-badge-96.png",
        })
      );
      sent += 1;
    } catch (error: any) {
      failed += 1;
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await db
          .from("admin_push_subscriptions")
          .update({
            enabled: false,
            updated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId)
          .eq("endpoint", row.endpoint);
      }
    }
  }

  return { ok: sent > 0, reason: sent > 0 ? null : "send_failed" as const, sent, failed };
}

export async function sendCustomerPushForOrderWithFallback(
  tenantId: string,
  orderId: string,
  payload: PushPayload
): Promise<CustomerPushResult> {
  if (!configureWebPush()) {
    const result: CustomerPushResult = { ok: false, reason: "missing_vapid", sent: 0, failed: 0, lookupSource: null };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: "customer_status_push_missing_vapid",
      title: "Customer status push not configured",
      body: "Customer status push could not be sent because VAPID configuration is missing.",
      status: "failed",
      payload: { ...result, orderId },
    });
    return result;
  }

  const orderLookup = await db
    .from("orders")
    .select("customer_name,customer_phone,customer_account_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderLookup.error) {
    const result: CustomerPushResult = { ok: false, reason: "query_failed", sent: 0, failed: 0, lookupSource: null };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: "customer_status_push_order_lookup_failed",
      title: "Customer status push lookup failed",
      body: "Customer status push could not load order details for fallback lookup.",
      status: "failed",
      payload: { ...result, orderId, error: orderLookup.error.message },
    });
    return result;
  }

  const customerPhone = orderLookup.data?.customer_phone || null;
  const customerName = orderLookup.data?.customer_name || null;
  const customerAccountId = orderLookup.data?.customer_account_id || null;

  const direct = await db
    .from("customer_push_subscriptions")
    .select("endpoint,p256dh,auth,enabled,order_id,customer_account_id")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .eq("enabled", true);

  if (direct.error) {
    const result: CustomerPushResult = { ok: false, reason: "query_failed", sent: 0, failed: 0, lookupSource: "order_id" };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: "customer_status_push_query_failed",
      title: "Customer status push lookup failed",
      body: "Customer status push could not query order-linked subscriptions.",
      status: "failed",
      payload: { ...result, orderId, error: direct.error.message },
    });
    return result;
  }

  let rows = (direct.data || []) as CustomerSubscriptionRow[];
  let lookupSource: CustomerPushResult["lookupSource"] = rows.length ? "order_id" : null;

  if (!rows.length && customerAccountId) {
    const byAccount = await db
      .from("customer_push_subscriptions")
      .select("endpoint,p256dh,auth,enabled,order_id,customer_account_id")
      .eq("tenant_id", tenantId)
      .eq("customer_account_id", customerAccountId)
      .eq("enabled", true);

    if (byAccount.error) {
      const result: CustomerPushResult = { ok: false, reason: "query_failed", sent: 0, failed: 0, lookupSource: "customer_account_id" };
      await logCustomerPushEvent({
        tenantId,
        orderId,
        eventType: "customer_status_push_query_failed",
        title: "Customer status push lookup failed",
        body: "Customer status push could not query customer-account subscriptions.",
        status: "failed",
        payload: { ...result, orderId, customerAccountId, error: byAccount.error.message },
      });
      return result;
    }

    rows = (byAccount.data || []) as CustomerSubscriptionRow[];
    lookupSource = rows.length ? "customer_account_id" : null;
    if (rows.length) await linkRowsToCurrentOrder(tenantId, orderId, rows);
  }

  if (!rows.length && customerPhone) {
    const byPhone = await db
      .from("customer_push_subscriptions")
      .select("endpoint,p256dh,auth,enabled,order_id,customer_account_id")
      .eq("tenant_id", tenantId)
      .eq("customer_phone", customerPhone)
      .eq("enabled", true);

    rows = (byPhone.data || []) as CustomerSubscriptionRow[];
    lookupSource = rows.length ? "customer_phone" : null;
    if (rows.length) await linkRowsToCurrentOrder(tenantId, orderId, rows);
  }

  if (!rows.length && customerName) {
    const byName = await db
      .from("customer_push_subscriptions")
      .select("endpoint,p256dh,auth,enabled,order_id,customer_account_id")
      .eq("tenant_id", tenantId)
      .eq("customer_name", customerName)
      .eq("enabled", true);

    rows = (byName.data || []) as CustomerSubscriptionRow[];
    lookupSource = rows.length ? "customer_name" : null;
    if (rows.length) await linkRowsToCurrentOrder(tenantId, orderId, rows);
  }

  if (!rows.length) {
    const result: CustomerPushResult = { ok: false, reason: "no_subscriptions", sent: 0, failed: 0, lookupSource: null };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: "customer_status_push_no_subscriptions",
      title: "No customer push device found",
      body: "Customer status push could not be sent because no enabled customer push subscription was found for this order or customer account.",
      status: "warning",
      payload: { ...result, orderId, customerAccountId, customerPhone: Boolean(customerPhone), customerName: Boolean(customerName) },
    });
    return result;
  }

  const sendResult = await sendRows(tenantId, rows, payload);
  const result: CustomerPushResult = { ...sendResult, lookupSource };

  await logCustomerPushEvent({
    tenantId,
    orderId,
    eventType: sendResult.ok ? "customer_status_push_sent" : "customer_status_push_failed",
    title: sendResult.ok ? "Customer status push sent" : "Customer status push failed",
    body: sendResult.ok
      ? `Customer status push was sent to ${sendResult.sent} device(s).`
      : "Customer status push found subscriptions but could not deliver to any device.",
    status: sendResult.ok ? "sent" : "failed",
    payload: { ...result, orderId, customerAccountId, tag: payload.tag || null },
  });

  return result;
}
