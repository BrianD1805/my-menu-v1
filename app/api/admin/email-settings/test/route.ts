import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { getOnboardingEmailRuntimeStatus, sendOwnerEmailSettingsTest } from "@/lib/onboarding-email";

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    status: getOnboardingEmailRuntimeStatus(),
    tenant: {
      name: auth.tenant.name,
      slug: auth.tenant.slug,
      storeAddress: `${auth.tenant.slug}.orduva.com`,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  let body: { recipient?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await sendOwnerEmailSettingsTest({
    tenantId: auth.tenant.id,
    tenantName: auth.tenant.name,
    tenantSlug: auth.tenant.slug,
    requestedBy: auth.user.email || auth.user.full_name || "admin user",
    recipient: body.recipient,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : result.skipped ? 400 : 502 });
}
