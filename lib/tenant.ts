import { headers } from "next/headers";
import { db } from "./db";

export async function resolveTenantSlug(): Promise<string> {
  const h = await headers();
  const host = h.get("host") || "";

  if (host.startsWith("demo.localhost")) return "demo";

  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return "demo";
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

export function resolveTenantSlugFromRequest(req: Request): string {
  const host = req.headers.get("host") || "";

  if (host.startsWith("demo.localhost")) return "demo";

  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return "demo";
}
