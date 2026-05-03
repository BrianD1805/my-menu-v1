import { headers } from "next/headers";
import { db } from "./db";
import { isRootPlatformHost, resolveTenantSlugFromHost } from "./tenant";

export async function resolveTenantSlug(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return resolveTenantSlugFromHost(host);
}


export async function isRootPlatformRequest(): Promise<boolean> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return isRootPlatformHost(host);
}

export function resolveTenantSlugFromRequest(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return resolveTenantSlugFromHost(host);
}

export async function getTenantBySlug(slug: string) {
  const { data, error } = await db
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!error && data) {
    return data;
  }

  // Ver-0.148A safety fallback while the ZimZa Express demo tenant is migrated
  // from the legacy slug "orduva" to the public demo slug "zimzaexpress".
  if (slug === "zimzaexpress") {
    const legacyResult = await db
      .from("tenants")
      .select("*")
      .eq("slug", "orduva")
      .single();

    if (!legacyResult.error && legacyResult.data) {
      return legacyResult.data;
    }
  }

  throw new Error(`Tenant not found for slug: ${slug}`);
}
