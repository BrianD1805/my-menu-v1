import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DEFAULT_PUSH_TEMPLATES, getTenantPushTemplates } from "@/lib/push-notification-settings";

function cleanText(value: unknown, fallback: string, maxLength = 220) {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maxLength);
}

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const templates = await getTenantPushTemplates(auth.tenant.id);
  return NextResponse.json({ ok: true, templates });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const submitted = Array.isArray(body?.templates) ? body.templates : [];
  const defaultsByKey = new Map(DEFAULT_PUSH_TEMPLATES.map((item) => [`${item.audience}:${item.eventType}`, item]));

  const rows = submitted
    .map((item: any) => {
      const audience = String(item?.audience || "").trim();
      const eventType = String(item?.eventType || item?.event_type || "").trim();
      const fallback = defaultsByKey.get(`${audience}:${eventType}`);
      if (!fallback) return null;
      return {
        tenant_id: auth.tenant.id,
        audience,
        event_type: eventType,
        title_template: cleanText(item?.titleTemplate, fallback.titleTemplate, 90),
        body_template: cleanText(item?.bodyTemplate, fallback.bodyTemplate, 260),
        enabled: item?.enabled !== false,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (!rows.length) return NextResponse.json({ error: "No valid notification settings were supplied." }, { status: 400 });

  const { error } = await db
    .from("tenant_push_notification_settings")
    .upsert(rows, { onConflict: "tenant_id,audience,event_type" });

  if (error) return NextResponse.json({ error: `Could not save push notification settings: ${error.message}` }, { status: 500 });

  const templates = await getTenantPushTemplates(auth.tenant.id);
  return NextResponse.json({ ok: true, message: "Push notification settings saved.", templates });
}
