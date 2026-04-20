import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { resolveTenantSlugFromHost } from "@/lib/tenant";

export const ADMIN_TENANT_COOKIE = "orduva_admin_tenant";

function cookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function normalizeAdminTenantSlug(value: unknown) {
  const slug = String(value || "").trim().toLowerCase();
  if (!slug) return "";
  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}

function readCookieFromHeader(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

export function resolveAdminTenantSlugFromRequest(req: Request, preferredSlug?: unknown) {
  const explicit = normalizeAdminTenantSlug(preferredSlug);
  if (explicit) return explicit;

  const cookieSlug = normalizeAdminTenantSlug(readCookieFromHeader(req, ADMIN_TENANT_COOKIE));
  if (cookieSlug) return cookieSlug;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return resolveTenantSlugFromHost(host);
}

export async function resolveAdminTenantSlugForPage() {
  const cookieStore = await cookies();
  const cookieSlug = normalizeAdminTenantSlug(cookieStore.get(ADMIN_TENANT_COOKIE)?.value);
  if (cookieSlug) return cookieSlug;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return resolveTenantSlugFromHost(host);
}

export function applyAdminTenantCookie(response: NextResponse, tenantSlug: string) {
  response.cookies.set(ADMIN_TENANT_COOKIE, tenantSlug, cookieOptions());
  return response;
}

export function clearAdminTenantCookie(response: NextResponse) {
  response.cookies.set(ADMIN_TENANT_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
