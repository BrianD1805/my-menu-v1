import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { applyCustomerSession, getCustomerByEmail, hashCustomerPassword, normalizeCustomerEmail } from "@/lib/customer-auth";

export async function POST(req: Request) {
  const tenantSlug = resolveTenantSlugFromRequest(req);
  const tenant = await getTenantBySlug(tenantSlug);
  const body = await req.json().catch(() => ({}));

  const fullName = String(body.fullName || "").trim();
  const phone = String(body.phone || "").trim() || null;
  const email = normalizeCustomerEmail(body.email);
  const password = String(body.password || "");

  if (!fullName || !email || password.length < 6) {
    return NextResponse.json({ error: "Please enter full name, email, and a password of at least 6 characters." }, { status: 400 });
  }

  const existing = await getCustomerByEmail(tenant.id, email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 400 });
  }

  const { data, error } = await db
    .from("customer_accounts")
    .insert({
      tenant_id: tenant.id,
      full_name: fullName,
      phone,
      email,
      password_hash: hashCustomerPassword(password),
      is_active: true,
    })
    .select("id, tenant_id, email, full_name, phone, password_hash, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create customer account." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, customer: { id: data.id, email: data.email, fullName: data.full_name } });
  return applyCustomerSession(response, data);
}
