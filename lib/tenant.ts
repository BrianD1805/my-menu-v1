import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

const ROOT_PLATFORM_HOSTS = new Set([
  "orduva.com",
  "www.orduva.com",
]);

const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "www",
  "app",
  "api",
  "assets",
  "static",
  "localhost",
]);

const TENANT_SUBDOMAIN_ALIASES: Record<string, string> = {
  // ZimZa Express currently uses the existing tenant slug "orduva" in Supabase.
  // The public storefront should now be able to live at zimzaexpress.orduva.com.
  zimzaexpress: "orduva",
  "zimza-express": "orduva",
};

function getDefaultTenantSlug() {
  return (
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ||
    "orduva"
  )
    .trim()
    .toLowerCase();
}

function getTenantAlias(subdomain: string) {
  return TENANT_SUBDOMAIN_ALIASES[subdomain] || subdomain;
}

export function getTenantSubdomainFromHost(host: string) {
  const hostname = normalizeHostname(host);
  if (!hostname) return "";

  if (hostname === "localhost" || hostname === "127.0.0.1") return "";
  if (hostname.endsWith(".localhost")) {
    const localSubdomain = hostname.split(".")[0] || "";
    return RESERVED_SUBDOMAINS.has(localSubdomain) ? "" : localSubdomain;
  }

  if (isSharedAdminHost(hostname)) return "";
  if (ROOT_PLATFORM_HOSTS.has(hostname)) return "";

  if (hostname.endsWith(".orduva.com")) {
    const subdomain = hostname.replace(/\.orduva\.com$/, "").split(".").pop() || "";
    return RESERVED_SUBDOMAINS.has(subdomain) ? "" : subdomain;
  }

  const parts = hostname.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0] || "";
    return RESERVED_SUBDOMAINS.has(subdomain) ? "" : subdomain;
  }

  return "";
}

export function resolveTenantSlugFromHost(host: string): string {
  const hostname = normalizeHostname(host);

  if (hostname.startsWith("demo.localhost")) return "demo";

  if (isSharedAdminHost(hostname)) {
    return getDefaultTenantSlug();
  }

  const subdomain = getTenantSubdomainFromHost(hostname);
  if (subdomain) {
    return getTenantAlias(subdomain);
  }

  return getDefaultTenantSlug();
}
