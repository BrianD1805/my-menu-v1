import { NextResponse } from "next/server";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, customer: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    customer: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.full_name,
      phone: session.user.phone,
    },
    tenant: {
      id: session.tenant.id,
      slug: session.tenant.slug,
      name: session.tenant.name,
    },
  });
}
