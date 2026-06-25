import webpush from "web-push";
import { db } from "@/lib/db";
import { buildPushFromSettings, inferPushEventType } from "@/lib/push-notification-settings";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string | null;
  eventType?: string;
  variables?: Record<string, unknown>;
};

type AdminSubscriptionRow = {
  endpoint: string;
  p256dh?: string | null;
  auth?: string | null;
  enabled?: boolean | null;
  p256dh_key?: string | null;
  auth_key?: string | null;
  is_active?: boolean | null;
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

function notificationJsonPayload(payload: PushPayload) {
  // Do not send `icon`, `image`, or `badge` in the web-push payload. On Android/Chrome
  // these can appear as the extra right-hand graphic in the notification card.
  // Let the browser use the installed app/site favicon on the left only.
  const data: Record<string, unknown> = {
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    tag: payload.tag,
  };

  return JSON.stringify(data);
}

async function logCustomerPushEvent(input: {
  tenantId: string;
  orderId: string;
  eventType: string;
  title: string;
  body: string;
  status: "sent" | "skipped" | "failed";
  metadata: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const { error } = await db.from("notification_events").insert({
    tenant_id: input.tenantId,
    order_id: input.orderId,
    audience: "customer",
    channel: "push",
    event_type: input.eventType,
    title: input.title,
    body: input.body,
    status: input.status,
    metadata: input.metadata || {},
    processed_at: input.status === "sent" || input.status === "skipped" ? now : null,
    failed_at: input.status === "failed" ? now : null,
    error_message:
      input.status === "failed" && typeof input.metadata?.error === "string"
        ? String(input.metadata.error)
        : null,
  });

  if (error) {
    console.error("[Orduva push] Failed to log customer notification event", {
      message: error.message,
      eventType: input.eventType,
      orderId: input.orderId,
      status: input.status,
    });
  }
}

async function logAdminPushEvent(input: {
  tenantId: string;
  eventType: string;
  title: string;
  body: string;
  status: "sent" | "skipped" | "failed";
  metadata: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const { error } = await db.from("notification_events").insert({
    tenant_id: input.tenantId,
    order_id: typeof input.metadata?.orderId === "string" ? String(input.metadata.orderId) : null,
    audience: "admin",
    channel: "push",
    event_type: input.eventType,
    title: input.title,
    body: input.body,
    status: input.status,
    metadata: input.metadata || {},
    processed_at: input.status === "sent" || input.status === "skipped" ? now : null,
    failed_at: input.status === "failed" ? now : null,
    error_message:
      input.status === "failed" && typeof input.metadata?.error === "string"
        ? String(input.metadata.error)
        : null,
  });

  if (error) {
    console.error("[Orduva push] Failed to log admin notification event", {
      message: error.message,
      eventType: input.eventType,
      status: input.status,
    });
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
        notificationJsonPayload({
          ...payload,
          url: payload.url || "/",
          tag: payload.tag || "orduva-customer-order-status",
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
  const orderIdFromTag = typeof payload.tag === "string" && payload.tag.startsWith("orduva-order-")
    ? payload.tag.replace("orduva-order-", "")
    : null;
  const eventType = inferPushEventType("admin", payload);
  const preparedPush = await buildPushFromSettings({
    tenantId,
    audience: "admin",
    eventType,
    fallbackTitle: payload.title,
    fallbackBody: payload.body,
    variables: { orderId: orderIdFromTag, ...payload.variables },
  });

  if (!preparedPush.enabled) {
    await logAdminPushEvent({
      tenantId,
      eventType: `${eventType}_disabled_by_settings`,
      title: "Admin push disabled",
      body: "This admin push was skipped by Store settings.",
      status: "skipped",
      metadata: { orderId: orderIdFromTag, tag: payload.tag || null },
    });
    return { ok: true, reason: null, sent: 0, failed: 0, skipped: true };
  }

  payload = {
    ...payload,
    title: preparedPush.title,
    body: preparedPush.body,
  };

  if (!configureWebPush()) {
    const result = { ok: false, reason: "missing_vapid" as const, sent: 0, failed: 0 };
    await logAdminPushEvent({
      tenantId,
      eventType: "admin_push_missing_vapid",
      title: "Admin push not configured",
      body: "Admin new-order push could not be sent because VAPID configuration is missing.",
      status: "failed",
      metadata: { ...result, orderId: orderIdFromTag, tag: payload.tag || null },
    });
    return result;
  }

  const { data, error } = await db
    .from("admin_push_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error) {
    const result = { ok: false, reason: "query_failed" as const, sent: 0, failed: 0 };
    await logAdminPushEvent({
      tenantId,
      eventType: "admin_push_query_failed",
      title: "Admin push lookup failed",
      body: "Admin new-order push could not query enabled admin devices.",
      status: "failed",
      metadata: { ...result, orderId: orderIdFromTag, tag: payload.tag || null, error: error.message },
    });
    return result;
  }

  const rows = ((data || []) as AdminSubscriptionRow[])
    .map((row) => ({
      endpoint: row.endpoint,
      p256dh: row.p256dh || row.p256dh_key || null,
      auth: row.auth || row.auth_key || null,
      enabled: row.enabled !== undefined && row.enabled !== null ? row.enabled : row.is_active,
    }))
    .filter((row) => row.endpoint && row.p256dh && row.auth && row.enabled !== false);

  if (!rows.length) {
    await db.from("notification_events").insert({
      tenant_id: tenantId,
      audience: "admin",
      channel: "in_app",
      event_type: "admin_push_no_enabled_devices",
      title: "Admin push not active",
      body: "A new-order admin push could not be sent because no enabled admin push devices were found for this tenant.",
      metadata: { route: "/admin", action: "enable_admin_push", orderId: orderIdFromTag, tag: payload.tag || null, savedRows: (data || []).length },
      status: "skipped",
      processed_at: new Date().toISOString(),
    });

    return { ok: false, reason: "no_subscriptions" as const, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        buildSubscription({ endpoint: row.endpoint!, p256dh: row.p256dh!, auth: row.auth! }),
        notificationJsonPayload({
          ...payload,
          url: payload.url || "/admin/orders",
          tag: payload.tag || "orduva-admin-push",
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
            is_active: false,
            updated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId)
          .eq("endpoint", row.endpoint);
      }
    }
  }

  const result = { ok: sent > 0, reason: sent > 0 ? null : "send_failed" as const, sent, failed };
  await logAdminPushEvent({
    tenantId,
    eventType: result.ok ? "admin_push_sent" : "admin_push_failed",
    title: result.ok ? "Admin push sent" : "Admin push failed",
    body: result.ok
      ? `Admin new-order push was sent to ${sent} device(s).`
      : "Admin new-order push found enabled devices but could not deliver to any device.",
    status: result.ok ? "sent" : "failed",
    metadata: { ...result, orderId: orderIdFromTag, tag: payload.tag || null },
  });

  return result;
}

export async function sendCustomerPushForOrderWithFallback(
  tenantId: string,
  orderId: string,
  payload: PushPayload
): Promise<CustomerPushResult> {
  const eventType = inferPushEventType("customer", payload);
  const preparedPush = await buildPushFromSettings({
    tenantId,
    audience: "customer",
    eventType,
    fallbackTitle: payload.title,
    fallbackBody: payload.body,
    variables: { orderId, ...payload.variables },
  });

  if (!preparedPush.enabled) {
    const result: CustomerPushResult = { ok: true, reason: null, sent: 0, failed: 0, lookupSource: null };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: `${eventType}_disabled_by_settings`,
      title: "Customer push disabled",
      body: "This customer push was skipped by Store settings.",
      status: "skipped",
      metadata: { ...result, orderId, tag: payload.tag || null },
    });
    return result;
  }

  payload = {
    ...payload,
    title: preparedPush.title,
    body: preparedPush.body,
  };

  if (!configureWebPush()) {
    const result: CustomerPushResult = { ok: false, reason: "missing_vapid", sent: 0, failed: 0, lookupSource: null };
    await logCustomerPushEvent({
      tenantId,
      orderId,
      eventType: "customer_status_push_missing_vapid",
      title: "Customer status push not configured",
      body: "Customer status push could not be sent because VAPID configuration is missing.",
      status: "failed",
      metadata: { ...result, orderId },
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
      metadata: { ...result, orderId, error: orderLookup.error.message },
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
      metadata: { ...result, orderId, error: direct.error.message },
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
        metadata: { ...result, orderId, customerAccountId, error: byAccount.error.message },
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
      status: "skipped",
      metadata: { ...result, orderId, customerAccountId, customerPhone: Boolean(customerPhone), customerName: Boolean(customerName) },
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
    metadata: { ...result, orderId, customerAccountId, tag: payload.tag || null },
  });

  return result;
}
