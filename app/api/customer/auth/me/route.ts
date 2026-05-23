import { NextResponse } from "next/server";
import { validateCustomerRequestSession } from "@/lib/customer-auth";
import { getTenantSettings } from "@/lib/tenant-settings";
import { getCustomerRewardSummary } from "@/lib/rewards";

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, customer: null }, { status: 401 });
  }

  const settings = await getTenantSettings(session.tenant.id);
  const rewards = await getCustomerRewardSummary({ tenantId: session.tenant.id, customerAccountId: session.user.id, settings });

  return NextResponse.json({
    ok: true,
    customer: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.full_name,
      phone: session.user.phone,
      addressLine1: session.user.address_line_1,
      addressLine2: session.user.address_line_2,
      city: session.user.city,
      postcode: session.user.postcode,
      rewards,
    },
    tenant: {
      id: session.tenant.id,
      slug: session.tenant.slug,
      name: session.tenant.name,
    },
  });
}
