import { NextResponse } from "next/server";
import { validateAdminRequestSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const session = await validateAdminRequestSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    tenant: {
      id: session.tenant.id,
      slug: session.tenant.slug,
      name: session.tenant.name,
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.full_name,
    },
  });
}
