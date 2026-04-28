import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

const NETLIFY_ROOT_HOSTS = new Set([
  "orduva.netlify.app",
]);

const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "www",
  "app",
  "api",
  "assets",
  "static",
  "platform",
  "localhost",
]);

const TENANT_SUBDOMAIN_ALIASES: Record<string, string> = {
  // ZimZa Express currently uses the existing tenant slug "orduva" in Supabase.
  // The public storefront lives at zimzaexpress.orduva.com until that tenant slug is migrated.
  zimzaexpress: "orduva",
  "zimza-express": "orduva",
};

export function getRootDomain() {
  return String(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
      process.env.ORDUVA_ROOT_DOMAIN ||
      "orduva.com",
  )
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

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

export function isRootPlatformHost(host: string) {
  const hostname = normalizeHostname(host);
  const rootDomain = getRootDomain();

  return (
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    NETLIFY_ROOT_HOSTS.has(hostname)
  );
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
  if (isRootPlatformHost(hostname)) return "";

  const rootDomain = getRootDomain();
  const rootSuffix = `.${rootDomain}`;

  if (hostname.endsWith(rootSuffix)) {
    const subdomain = hostname.slice(0, -rootSuffix.length).split(".").pop() || "";
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
