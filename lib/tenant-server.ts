import { headers } from "next/headers";
import { db } from "./db";
import { resolveTenantSlugFromHost } from "./tenant";

export async function resolveTenantSlug(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return resolveTenantSlugFromHost(host);
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

  if (error || !data) {
    throw new Error(`Tenant not found for slug: ${slug}`);
  }

  return data;
}
