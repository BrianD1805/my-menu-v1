import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { buildAnalyticsSummary } from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await requireAdminApiUser(req);
  if ("error" in session) return session.error;

  try {
    const summary = await buildAnalyticsSummary({ tenantId: session.tenant.id, days: 30 });
    return NextResponse.json({ tenant: { id: session.tenant.id, slug: session.tenant.slug, name: session.tenant.name }, summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load tenant analytics." }, { status: 500 });
  }
}
