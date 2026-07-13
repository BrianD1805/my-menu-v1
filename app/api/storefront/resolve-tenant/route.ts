import { NextResponse } from "next/server";
import {
  CUSTOM_DOMAIN_INACTIVE_TENANT_SLUG,
  getTenantBySlug,
  resolveActiveCustomDomainTenantSlugFromHost,
  resolveTenantSlugFromRequestAsync,
} from "@/lib/tenant-server";
import { resolveTenantSlugFromHost } from "@/lib/tenant";

function requestHost(req: Request) {
  return req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
}

function noStoreJson(payload: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(req: Request) {
  try {
    const host = requestHost(req);
    const fallbackSlug = resolveTenantSlugFromHost(host);
    const customDomainSlug = await resolveActiveCustomDomainTenantSlugFromHost(host);
    const tenantSlug = await resolveTenantSlugFromRequestAsync(req);
    if (tenantSlug === CUSTOM_DOMAIN_INACTIVE_TENANT_SLUG) {
      return noStoreJson(
        {
          ok: false,
          inactiveCustomDomain: true,
          error: "This custom domain is not active for a store yet.",
        },
        { status: 404 },
      );
    }

    const tenant = await getTenantBySlug(tenantSlug);

    return noStoreJson({
      ok: true,
      tenantSlug: tenant.slug || tenantSlug,
      tenantId: tenant.id,
      tenantName: tenant.name,
      customDomainActive: Boolean(customDomainSlug),
      fallbackSlug,
    });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not resolve store.",
      },
      { status: 404 },
    );
  }
}
