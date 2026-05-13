import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";

export const runtime = "nodejs";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function publicSiteOrigin(req: Request) {
  const configured = process.env.ORDUVA_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (configured) return configured.replace(/\/$/, "");
  const url = new URL(req.url);
  const host = url.host.toLowerCase();
  if (host === "localhost:3000" || host.startsWith("localhost") || host.startsWith("127.0.0.1")) return `${url.protocol}//${url.host}`.replace(/\/$/, "");
  return "https://www.orduva.com";
}

export async function POST(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;

    const { data: settings, error } = await db
      .from("tenant_settings")
      .select("tenant_id, currency_code, yoco_customer_mode, yoco_customer_secret_key, yoco_customer_webhook_secret, yoco_customer_webhook_id, yoco_customer_webhook_url")
      .eq("tenant_id", tenantLookup.tenant.id)
      .maybeSingle();

    if (error || !settings) {
      return NextResponse.json({ error: "Yoco settings were not found for this tenant." }, { status: 404 });
    }

    const secretKey = getString((settings as Record<string, unknown>).yoco_customer_secret_key);
    if (!secretKey) {
      return NextResponse.json({ error: "Save this tenant's Yoco secret key before registering the webhook." }, { status: 400 });
    }

    const existingSecret = getString((settings as Record<string, unknown>).yoco_customer_webhook_secret);
    if (existingSecret) {
      return NextResponse.json({
        ok: true,
        alreadyConfigured: true,
        webhookSecretSet: true,
        webhookSecretHint: `••••${existingSecret.slice(-4)}`,
        webhookId: getString((settings as Record<string, unknown>).yoco_customer_webhook_id),
        webhookUrl: getString((settings as Record<string, unknown>).yoco_customer_webhook_url) || `${publicSiteOrigin(req)}/api/storefront/yoco/webhook`,
        message: "Yoco webhook secret is already saved for this tenant.",
      });
    }

    const webhookUrl = `${publicSiteOrigin(req)}/api/storefront/yoco/webhook`;
    const response = await fetch("https://payments.yoco.com/api/webhooks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Orduva ${tenantLookup.tenant.slug} ${String((settings as Record<string, unknown>).yoco_customer_mode || "test")} storefront webhook`,
        url: webhookUrl,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const webhookSecret = getString(payload?.secret);
    const webhookId = getString(payload?.id);

    if (!response.ok || !webhookSecret) {
      return NextResponse.json({
        error: getString((payload as any)?.error?.message) || getString((payload as any)?.message) || `Yoco webhook registration failed with status ${response.status}.`,
      }, { status: 400 });
    }

    const { error: updateError } = await db
      .from("tenant_settings")
      .update({
        yoco_customer_webhook_secret: webhookSecret,
        yoco_customer_webhook_id: webhookId || null,
        yoco_customer_webhook_url: webhookUrl,
        yoco_connection_status: "configured",
      })
      .eq("tenant_id", tenantLookup.tenant.id);

    if (updateError) {
      return NextResponse.json({ error: "Yoco webhook was created, but Orduva could not save the webhook secret. Contact support before creating another webhook." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      webhookSecretSet: true,
      webhookSecretHint: `••••${webhookSecret.slice(-4)}`,
      webhookId,
      webhookUrl,
      message: "Yoco webhook registered and saved.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yoco webhook registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
