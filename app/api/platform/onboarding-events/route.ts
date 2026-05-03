import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function getPlatformKey() {
  return (process.env.ORDUVA_PLATFORM_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || "").trim();
}
function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = (req.headers.get("x-orduva-platform-key") || "").trim();
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Platform access key required" }, { status: 401 });
  return null;
}

type TenantRow = { id: string; name: string; slug: string; status: string | null; created_at: string | null };
type TenantUserRow = { tenant_id: string; email: string | null; full_name: string | null; role: string | null; created_at: string | null };
type EventRow = { id: string; tenant_id: string | null; audience: string | null; event_type: string | null; title: string | null; status: string | null; channel: string | null; created_at: string | null; processed_at: string | null; failed_at: string | null; error_message: string | null; metadata: Record<string, unknown> | null };

function storeAddress(slug: string) { return `${slug}.orduva.com`; }
function storeUrl(slug: string) { return `https://${storeAddress(slug)}`; }
function adminLoginUrl(slug: string) { return `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`; }
function isClientOnboardingEmail(event: EventRow) { return String(event.event_type || "").startsWith("client_onboarding_email_"); }
function isOwnerOnboardingEmail(event: EventRow) { return String(event.event_type || "").startsWith("owner_new_store_email_"); }
function statusLabel(event: EventRow | null) {
  if (!event) return "No event yet";
  if (event.status === "sent") return "Sent";
  if (event.status === "skipped") return "Skipped";
  if (event.status === "failed") return "Failed";
  return event.status || "Logged";
}
function emailRecipient(event: EventRow | null) {
  const value = event?.metadata?.recipient;
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  try {
    const { data: tenants, error: tenantsError } = await db.from("tenants").select("id, name, slug, status, created_at").order("created_at", { ascending: false }).limit(30);
    if (tenantsError) return NextResponse.json({ error: "Failed to load recent stores" }, { status: 500 });

    const tenantRows = (tenants || []) as TenantRow[];
    const tenantIds = tenantRows.map((tenant) => tenant.id);
    let ownerUsers: TenantUserRow[] = [];
    let emailEvents: EventRow[] = [];

    if (tenantIds.length) {
      const { data: users } = await db.from("tenant_users").select("tenant_id, email, full_name, role, created_at").in("tenant_id", tenantIds).eq("role", "owner").order("created_at", { ascending: true });
      ownerUsers = (users || []) as TenantUserRow[];
      const { data: events } = await db.from("notification_events").select("id, tenant_id, audience, event_type, title, status, channel, created_at, processed_at, failed_at, error_message, metadata").in("tenant_id", tenantIds).eq("channel", "email").order("created_at", { ascending: false }).limit(160);
      emailEvents = ((events || []) as EventRow[]).filter((event) => isClientOnboardingEmail(event) || isOwnerOnboardingEmail(event));
    }

    const ownerByTenant = new Map<string, TenantUserRow>();
    for (const user of ownerUsers) if (!ownerByTenant.has(user.tenant_id)) ownerByTenant.set(user.tenant_id, user);
    const eventsByTenant = new Map<string, EventRow[]>();
    for (const event of emailEvents) {
      if (!event.tenant_id) continue;
      eventsByTenant.set(event.tenant_id, [...(eventsByTenant.get(event.tenant_id) || []), event]);
    }

    const signups = tenantRows.map((tenant) => {
      const owner = ownerByTenant.get(tenant.id) || null;
      const events = eventsByTenant.get(tenant.id) || [];
      const clientEmail = events.find(isClientOnboardingEmail) || null;
      const ownerEmail = events.find(isOwnerOnboardingEmail) || null;
      const hasIssue = [clientEmail, ownerEmail].some((event) => event?.status === "failed");
      const emailComplete = clientEmail?.status === "sent" && ownerEmail?.status === "sent";
      return {
        id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status || "setup", createdAt: tenant.created_at,
        storeAddress: storeAddress(tenant.slug), storefrontUrl: storeUrl(tenant.slug), adminLoginUrl: adminLoginUrl(tenant.slug),
        ownerName: owner?.full_name || null, ownerEmail: owner?.email || emailRecipient(clientEmail),
        clientEmail: { status: clientEmail?.status || null, label: statusLabel(clientEmail), recipient: emailRecipient(clientEmail), eventType: clientEmail?.event_type || null, createdAt: clientEmail?.created_at || null, errorMessage: clientEmail?.error_message || null },
        ownerNotification: { status: ownerEmail?.status || null, label: statusLabel(ownerEmail), recipient: emailRecipient(ownerEmail), eventType: ownerEmail?.event_type || null, createdAt: ownerEmail?.created_at || null, errorMessage: ownerEmail?.error_message || null },
        emailComplete, hasIssue,
      };
    });

    const now = Date.now();
    const createdToday = signups.filter((signup) => {
      if (!signup.createdAt) return false;
      const value = new Date(signup.createdAt).getTime();
      return !Number.isNaN(value) && now - value <= 24 * 60 * 60 * 1000;
    }).length;

    return NextResponse.json({ signups, summary: { totalShown: signups.length, createdToday, emailComplete: signups.filter((signup) => signup.emailComplete).length, needsAttention: signups.filter((signup) => signup.hasIssue).length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load onboarding events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
