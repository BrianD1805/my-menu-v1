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

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const { count } = await db
    .from("admin_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", auth.tenant.id)
    .eq("is_active", true);

  return NextResponse.json({
    ok: true,
    vapidConfigured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()),
    activeSubscriptions: count || 0,
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
    tenant_user_id: auth.user.id,
    endpoint: subscription.endpoint,
    p256dh_key: subscription.keys.p256dh,
    auth_key: subscription.keys.auth,
    expiration_time: subscription.expirationTime || null,
    user_agent: req.headers.get("user-agent") || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("admin_push_subscriptions").upsert(payload, { onConflict: "endpoint" });
  if (error) {
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Push-ready device saved for this tenant." });
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
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("tenant_id", auth.tenant.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: "Failed to disable push subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
