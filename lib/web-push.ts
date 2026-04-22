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

async function sendRows(rows: CustomerSubscriptionRow[], payload: PushPayload) {
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
          icon: payload.icon || "/orduva-storefront-icon-192.png",
          badge: payload.badge || "/orduva-storefront-icon-192.png",
        })
      );
      sent += 1;
    } catch (error: any) {
      failed += 1;
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

  if (error || !data?.length) {
    return { ok: false, reason: error ? "query_failed" as const : "no_subscriptions" as const, sent: 0, failed: 0 };
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
          icon: payload.icon || "/orduva-admin-icon-192.png",
          badge: payload.badge || "/orduva-admin-icon-192.png",
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
) {
  if (!configureWebPush()) {
    return { ok: false, reason: "missing_vapid" as const, sent: 0, failed: 0 };
  }

  const direct = await db
    .from("customer_push_subscriptions")
    .select("endpoint,p256dh,auth,enabled,order_id")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .eq("enabled", true);

  if (direct.data?.length) {
    return sendRows(direct.data as CustomerSubscriptionRow[], payload);
  }

  const orderLookup = await db
    .from("orders")
    .select("customer_name,customer_phone,customer_account_id")
    .eq("id", orderId)
    .maybeSingle();

  const customerPhone = orderLookup.data?.customer_phone || null;
  const customerName = orderLookup.data?.customer_name || null;

  if (customerPhone) {
    const byPhone = await db
      .from("customer_push_subscriptions")
      .select("endpoint,p256dh,auth,enabled,order_id")
      .eq("tenant_id", tenantId)
      .eq("customer_phone", customerPhone)
      .eq("enabled", true);

    if (byPhone.data?.length) {
      return sendRows(byPhone.data as CustomerSubscriptionRow[], payload);
    }
  }

  if (customerName) {
    const byName = await db
      .from("customer_push_subscriptions")
      .select("endpoint,p256dh,auth,enabled,order_id")
      .eq("tenant_id", tenantId)
      .eq("customer_name", customerName)
      .eq("enabled", true);

    if (byName.data?.length) {
      return sendRows(byName.data as CustomerSubscriptionRow[], payload);
    }
  }

  return { ok: false, reason: "no_subscriptions" as const, sent: 0, failed: 0 };
}
