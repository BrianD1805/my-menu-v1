import { NextResponse } from "next/server";
import { applyAdminSessionCookie, getTenantUserByEmail, normalizeOwnerEmail, verifyOwnerPassword } from "@/lib/admin-auth";
import { getTenantBySlug, resolveTenantSlugFromRequest } from "@/lib/tenant-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeOwnerEmail(body?.email);
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const tenantSlug = resolveTenantSlugFromRequest(req);
    const tenant = await getTenantBySlug(tenantSlug);
    const user = await getTenantUserByEmail(tenant.id, email);

    if (!user || !user.is_active || !verifyOwnerPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid owner login" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } });
    await applyAdminSessionCookie(response, user);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
