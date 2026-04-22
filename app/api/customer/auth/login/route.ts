import { NextResponse } from "next/server";
import { getTenantBySlug, resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { applyCustomerSession, getCustomerByEmail, normalizeCustomerEmail, verifyCustomerPassword } from "@/lib/customer-auth";

export async function POST(req: Request) {
  const tenantSlug = resolveTenantSlugFromRequest(req);
  const tenant = await getTenantBySlug(tenantSlug);
  const body = await req.json().catch(() => ({}));

  const email = normalizeCustomerEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await getCustomerByEmail(tenant.id, email);
  if (!user || !user.is_active || !verifyCustomerPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    customer: { id: user.id, email: user.email, fullName: user.full_name, phone: user.phone },
  });
  return applyCustomerSession(response, user);
}
