import { NextResponse } from "next/server";
import { applyAdminSessionCookie } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { requirePlatformAccess } from "@/lib/platform-security";

type TenantRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type TenantUserRow = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  is_active: boolean;
  role: string | null;
};

function cleanId(value: unknown) {
  const id = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

export async function POST(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = cleanId(body?.tenantId);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant id is required." }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant could not be found." }, { status: 404 });
    }

    const tenantRow = tenant as TenantRow;
    if (!tenantRow.slug) {
      return NextResponse.json({ error: "Tenant does not have a valid admin slug." }, { status: 409 });
    }

    const { data: users, error: userError } = await db
      .from("tenant_users")
      .select("id, tenant_id, email, full_name, password_hash, is_active, role")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1);

    if (userError || !users?.length) {
      return NextResponse.json({ error: "No active tenant admin user exists for this store yet." }, { status: 404 });
    }

    const user = users[0] as TenantUserRow;
    const response = NextResponse.json({
      success: true,
      tenant: { id: tenantRow.id, name: tenantRow.name || tenantRow.slug, slug: tenantRow.slug },
      user: { email: user.email, full_name: user.full_name, role: user.role },
    });

    await applyAdminSessionCookie(response, user, tenantRow.slug);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open tenant admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
