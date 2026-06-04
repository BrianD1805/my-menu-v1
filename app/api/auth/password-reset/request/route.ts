import { NextResponse } from "next/server";
import { getTenantBySlug, resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { normalizeAdminTenantSlug } from "@/lib/admin-tenant-context";
import { db } from "@/lib/db";
import {
  createPasswordResetToken,
  normalizePasswordResetEmail,
  sendPasswordResetEmail,
  storePasswordResetToken,
  type PasswordResetScope,
} from "@/lib/password-reset";

type TenantUserRow = { id: string; tenant_id: string; email: string; full_name: string | null; is_active: boolean };
type CustomerRow = { id: string; tenant_id: string; email: string; full_name: string | null; is_active: boolean };

function getRequestOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function getIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

async function getTenantAdminUser(tenantId: string, email: string) {
  const { data, error } = await db
    .from("tenant_users")
    .select("id, tenant_id, email, full_name, is_active")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as TenantUserRow;
}

async function getCustomerUser(tenantId: string, email: string) {
  const { data, error } = await db
    .from("customer_accounts")
    .select("id, tenant_id, email, full_name, is_active")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as CustomerRow;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = String(body?.scope || "customer") as PasswordResetScope;
    const email = normalizePasswordResetEmail(body?.email);

    if (scope !== "customer" && scope !== "tenant_admin") {
      return NextResponse.json({ error: "Password reset type is invalid." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    let tenantSlug = "";
    if (scope === "tenant_admin") {
      tenantSlug = normalizeAdminTenantSlug(body?.tenantSlug);
      if (!tenantSlug) {
        return NextResponse.json({ error: "Store address is required for Tenant Admin password reset." }, { status: 400 });
      }
    } else {
      tenantSlug = resolveTenantSlugFromRequest(req);
    }

    const tenant = await getTenantBySlug(tenantSlug);
    const user = scope === "tenant_admin" ? await getTenantAdminUser(tenant.id, email) : await getCustomerUser(tenant.id, email);

    if (user) {
      const token = createPasswordResetToken();
      await storePasswordResetToken({
        tenantId: tenant.id,
        scope,
        accountId: user.id,
        email,
        token,
        requestIp: getIp(req),
        userAgent: req.headers.get("user-agent"),
      });

      const origin = scope === "tenant_admin" ? "https://admin.orduva.com" : getRequestOrigin(req);
      const path = scope === "tenant_admin" ? "/admin/reset-password" : "/account/reset-password";
      const resetUrl = `${origin}${path}?token=${encodeURIComponent(token)}`;
      const sendResult = await sendPasswordResetEmail({ to: email, storeName: tenant.name, resetUrl, scope });
      if (!sendResult.ok && !sendResult.skipped) {
        console.error("[Orduva password reset] Email send failed", sendResult.error);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "If that email exists for this store, a password reset link has been sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not request password reset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
