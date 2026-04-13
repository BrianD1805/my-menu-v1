export function resolveTenantSlugFromHost(host: string): string {
  if (host.startsWith("demo.localhost")) return "demo";

  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return "orduva";
}
