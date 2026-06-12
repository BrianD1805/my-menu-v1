import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

const vapidConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const { data, error } = await db
    .from("admin_push_subscriptions")
    .select("*")
    .eq("tenant_id", auth.tenant.id);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `Could not load saved devices: ${error.message}`,
        vapidConfigured: vapidConfigured(),
        activeSubscriptions: 0,
        disabledSubscriptions: 0,
        totalSubscriptions: 0,
        alertStatus: "error",
        warning: "Admin push health could not be checked. Please test admin push before relying on new order alerts.",
        permissionHint: "Use an installed admin PWA on phone for the best result.",
      },
      { status: 500 }
    );
  }

  const rows = data || [];
  const rowEnabled = (row: any) => row.enabled !== undefined && row.enabled !== null ? row.enabled === true : row.is_active === true;
  const activeSubscriptions = rows.filter((row) => rowEnabled(row)).length;
  const disabledSubscriptions = rows.filter((row) => !rowEnabled(row)).length;
  const totalSubscriptions = rows.length;
  const latestSeenAt = rows
    .map((row) => row.last_seen_at || row.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  const alertStatus = activeSubscriptions > 0 ? "active" : disabledSubscriptions > 0 ? "disabled" : "missing";
  const warning =
    activeSubscriptions > 0
      ? null
      : disabledSubscriptions > 0
        ? "Admin order alerts are currently disabled. You may miss new order notifications until admin push is re-enabled."
        : "No active admin push device is saved. You may miss new order notifications until admin push is enabled.";

  return NextResponse.json({
    ok: true,
    vapidConfigured: vapidConfigured(),
    activeSubscriptions,
    disabledSubscriptions,
    totalSubscriptions,
    alertStatus,
    warning,
    latestSeenAt,
    permissionHint: "Use an installed admin PWA on phone for the best result.",
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as { subscription?: PushSubscriptionPayload };
  const subscription = body.subscription;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid push subscription payload" }, { status: 400 });
  }

  const payload = {
    tenant_id: auth.tenant.id,
    admin_user_id: auth.user.id,
    admin_email: auth.user.email,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    p256dh_key: subscription.keys.p256dh,
    auth_key: subscription.keys.auth,
    user_agent: req.headers.get("user-agent") || null,
    device_label: "Installed admin PWA",
    enabled: true,
    is_active: true,
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await db.from("admin_push_subscriptions").upsert(payload, { onConflict: "endpoint" });
  if (error) {
    return NextResponse.json(
      { error: `Failed to save push subscription: ${error.message}` },
      { status: 500 }
    );
  }

  const { count } = await db
    .from("admin_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", auth.tenant.id)
    .eq("enabled", true);

  return NextResponse.json({
    ok: true,
    message: "This device is now saved for real admin push notifications.",
    activeSubscriptions: count || 0,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  const endpoint = String(body.endpoint || "").trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const { error } = await db
    .from("admin_push_subscriptions")
    .update({
      enabled: false,
      is_active: false,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq("tenant_id", auth.tenant.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: `Failed to disable push subscription: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
