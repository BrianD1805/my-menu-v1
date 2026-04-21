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

type DbSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
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

function buildSubscription(row: DbSubscriptionRow) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
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

  for (const row of data as DbSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        buildSubscription(row),
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/admin/orders",
          tag: payload.tag || "orduva-admin-new-order",
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
