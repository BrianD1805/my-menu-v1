import { db } from "./db";

export function resolveTenantSlugFromHost(host: string): string {
  if (host.startsWith("demo.localhost")) return "demo";

  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return "orduva";
}

export async function getTenantBySlug(slug: string) {
  const { data, error } = await db
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`Tenant not found for slug: ${slug}`);
  }

  return data;
}
