import { NextResponse } from "next/server";
import { applyAdminSessionCookie, getTenantUserByEmail, normalizeOwnerEmail, verifyOwnerPassword } from "@/lib/admin-auth";
import { normalizeAdminTenantSlug } from "@/lib/admin-tenant-context";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant-server";

type TenantUserRow = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  is_active: boolean;
  role: string | null;
};

async function getActiveTenantUsersByEmail(email: string) {
  const { data, error } = await db
    .from("tenant_users")
    .select("id, tenant_id, email, full_name, password_hash, is_active, role")
    .eq("email", email)
    .eq("is_active", true)
    .limit(20);

  if (error || !data) return [];
  return data as TenantUserRow[];
}

async function getTenantById(tenantId: string) {
  const { data, error } = await db
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeOwnerEmail(body?.email);
    const password = String(body?.password || "");
    const explicitTenantSlug = normalizeAdminTenantSlug(body?.tenantSlug);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (explicitTenantSlug) {
      const tenant = await getTenantBySlug(explicitTenantSlug);
      const user = await getTenantUserByEmail(tenant.id, email);

      if (!user || !user.is_active || !verifyOwnerPassword(password, user.password_hash)) {
        return NextResponse.json({ error: "Invalid owner login" }, { status: 401 });
      }

      const response = NextResponse.json({ success: true, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } });
      await applyAdminSessionCookie(response, user, tenant.slug);
      return response;
    }

    const candidateUsers = await getActiveTenantUsersByEmail(email);
    const matchingUsers = candidateUsers.filter((user) => verifyOwnerPassword(password, user.password_hash));

    if (matchingUsers.length < 1) {
      return NextResponse.json({ error: "Invalid owner login" }, { status: 401 });
    }

    if (matchingUsers.length > 1) {
      return NextResponse.json(
        { error: "This email is linked to more than one store. Please use the store-specific admin link from your Orduva email." },
        { status: 409 },
      );
    }

    const user = matchingUsers[0]!;
    const tenant = await getTenantById(user.tenant_id);
    if (!tenant) {
      return NextResponse.json({ error: "Store account could not be found for this login" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } });
    await applyAdminSessionCookie(response, user, tenant.slug);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
