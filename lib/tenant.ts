import { isSharedAdminHost } from "@/lib/admin-host";

export function resolveTenantSlugFromHost(host: string): string {
  if (host.startsWith("demo.localhost")) return "demo";

  const hostWithoutPort = host.split(":")[0].toLowerCase();

  if (isSharedAdminHost(hostWithoutPort)) {
    return "orduva";
  }

  const parts = hostWithoutPort.split(".");

  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return "orduva";
}
