import { NextResponse } from "next/server";
import { applyAdminSessionCookie, countTenantUsers, getTenantUserByEmail, hashOwnerPassword, normalizeOwnerEmail } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlugFromRequest } from "@/lib/tenant-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body?.fullName || "").trim() || null;
    const email = normalizeOwnerEmail(body?.email);
    const password = String(body?.password || "");
    const accessKey = String(body?.accessKey || "").trim();

    if (!email || !password || !accessKey) {
      return NextResponse.json({ error: "Full owner setup details are required" }, { status: 400 });
    }

    const expectedKey = process.env.ADMIN_ACCESS_KEY?.trim() || "";
    if (!expectedKey) {
      return NextResponse.json({ error: "ADMIN_ACCESS_KEY is not configured" }, { status: 500 });
    }
    if (accessKey !== expectedKey) {
      return NextResponse.json({ error: "Invalid bootstrap access key" }, { status: 401 });
    }

    const tenantSlug = resolveTenantSlugFromRequest(req);
    const tenant = await getTenantBySlug(tenantSlug);
    const existingCount = await countTenantUsers(tenant.id);
    if (existingCount > 0) {
      return NextResponse.json({ error: "This tenant already has an owner login. Use the normal sign-in form." }, { status: 400 });
    }

    const existingUser = await getTenantUserByEmail(tenant.id, email);
    if (existingUser) {
      return NextResponse.json({ error: "That owner email already exists for this tenant" }, { status: 400 });
    }

    const { data: user, error } = await db
      .from("tenant_users")
      .insert({
        tenant_id: tenant.id,
        email,
        full_name: fullName,
        role: "owner",
        is_active: true,
        password_hash: hashOwnerPassword(password),
      })
      .select("id, tenant_id, email, full_name, password_hash, is_active, role")
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Failed to create owner login" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } });
    await applyAdminSessionCookie(response, user);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
