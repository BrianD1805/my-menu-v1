import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customer-auth";
import { resolveTenantSlugFromRequest } from "@/lib/tenant-server";

function redirectTarget(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");
  if (next && next.startsWith("/")) return next;
  return "/";
}

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL(redirectTarget(req), req.url), { status: 303 });
  return clearCustomerSession(response);
}
