import { headers } from "next/headers";
import { db } from "./db";
import { isSharedAdminHost, normalizeHostname } from "./admin-host";
import { normaliseCustomDomain } from "./custom-domain-addon";
import {
  getRootDomain,
  isRootPlatformHost,
  resolveTenantSlugFromHost,
} from "./tenant";

function getRequestHostValue(host: string | null | undefined) {
  return normalizeHostname(String(host || ""));
}

export const CUSTOM_DOMAIN_INACTIVE_TENANT_SLUG = "custom-domain-not-active";

function isIpAddress(hostname: string) {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  return hostname === "::1" || /^[a-f0-9:]+$/i.test(hostname);
}

function isLocalhost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function shouldCheckCustomDomain(host: string) {
  const hostname = getRequestHostValue(host);
  if (!hostname) return false;
  if (isLocalhost(hostname) || isIpAddress(hostname)) return false;
  if (isSharedAdminHost(hostname)) return false;
  if (isRootPlatformHost(hostname)) return false;

  const rootDomain = getRootDomain();
  if (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`)) {
    return false;
  }

  return Boolean(normaliseCustomDomain(hostname));
}

export async function resolveActiveCustomDomainTenantSlugFromHost(
  host: string,
): Promise<string | null> {
  const normalizedDomain = normaliseCustomDomain(host);
  if (!normalizedDomain || !shouldCheckCustomDomain(host)) return null;

  try {
    const { data: domainRow, error: domainError } = await db
      .from("tenant_custom_domains")
      .select("tenant_id, status, billing_status")
      .eq("normalized_domain", normalizedDomain)
      .eq("status", "active")
      .in("billing_status", ["active", "manual"])
      .maybeSingle();

    if (domainError || !domainRow?.tenant_id) return null;

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("slug")
      .eq("id", domainRow.tenant_id)
      .maybeSingle();

    if (tenantError || !tenant?.slug) return null;
    return String(tenant.slug || "").trim().toLowerCase() || null;
  } catch (error) {
    console.warn("[Orduva custom domains] Could not resolve host", {
      host: getRequestHostValue(host),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function resolveTenantSlugFromHostAsync(host: string): Promise<string> {
  const customDomainSlug = await resolveActiveCustomDomainTenantSlugFromHost(host);
  if (customDomainSlug) return customDomainSlug;
  if (shouldCheckCustomDomain(host)) return CUSTOM_DOMAIN_INACTIVE_TENANT_SLUG;
  return resolveTenantSlugFromHost(host);
}

export async function resolveTenantSlug(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return resolveTenantSlugFromHostAsync(host);
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

export async function resolveTenantSlugFromRequestAsync(req: Request): Promise<string> {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return resolveTenantSlugFromHostAsync(host);
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

  throw new Error(`Store not found for address: ${slug}`);
}
