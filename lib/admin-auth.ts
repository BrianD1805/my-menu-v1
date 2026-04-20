import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearAdminTenantCookie, resolveAdminTenantSlugForPage, resolveAdminTenantSlugFromRequest, applyAdminTenantCookie } from "@/lib/admin-tenant-context";

export const ADMIN_SESSION_COOKIE = "orduva_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const HASH_PREFIX = "scrypt";

type SessionPayload = {
  tenantUserId: string;
  tenantId: string;
  exp: number;
};

type TenantUserRow = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  is_active: boolean;
  role: string | null;
};

function getAuthSecret() {
  return (
    process.env.ORDUVA_AUTH_SECRET?.trim() ||
    process.env.ADMIN_ACCESS_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function normalizeOwnerEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function hashOwnerPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyOwnerPassword(password: string, storedHash: string | null | undefined) {
  const value = String(storedHash || "");
  const [prefix, salt, hash] = value.split("$");
  if (prefix !== HASH_PREFIX || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  if (candidate.length !== target.length) return false;
  return timingSafeEqual(candidate, target);
}

export function createAdminSessionToken(payload: SessionPayload) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

function readAdminSessionToken(token: string | null | undefined): SessionPayload | null {
  const value = String(token || "").trim();
  if (!value || !getAuthSecret()) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  if (sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionPayload;
    if (!payload?.tenantUserId || !payload?.tenantId || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getTenantUserByEmail(tenantId: string, email: string) {
  const normalizedEmail = normalizeOwnerEmail(email);
  const { data, error } = await db
    .from("tenant_users")
    .select("id, tenant_id, email, full_name, password_hash, is_active, role")
    .eq("tenant_id", tenantId)
    .eq("email", normalizedEmail)
    .single();

  if (error || !data) return null;
  return data as TenantUserRow;
}

export async function getTenantUserById(tenantUserId: string) {
  const { data, error } = await db
    .from("tenant_users")
    .select("id, tenant_id, email, full_name, password_hash, is_active, role")
    .eq("id", tenantUserId)
    .single();

  if (error || !data) return null;
  return data as TenantUserRow;
}

export async function countTenantUsers(tenantId: string) {
  const { count } = await db.from("tenant_users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
  return count || 0;
}

export function buildAdminSessionForUser(user: TenantUserRow) {
  return createAdminSessionToken({
    tenantUserId: user.id,
    tenantId: user.tenant_id,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export async function validateAdminRequestSession(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);

  const session = readAdminSessionToken(token);
  if (!session) return null;

  const tenantSlug = resolveAdminTenantSlugFromRequest(req);
  if (!tenantSlug) return null;

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, slug, name, whatsapp_number")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) return null;
  if (tenant.id !== session.tenantId) return null;

  const user = await getTenantUserById(session.tenantUserId);
  if (!user || !user.is_active || user.tenant_id !== tenant.id) return null;

  return { tenant, user };
}

export async function requireAdminApiUser(req: Request) {
  const session = await validateAdminRequestSession(req);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Owner login required" }, { status: 401 }),
    };
  }

  return session;
}

export async function requireAdminPageUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  const session = readAdminSessionToken(token);
  if (!session) {
    redirect("/admin/login");
  }

  const tenantSlug = await resolveAdminTenantSlugForPage();
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, slug, name, whatsapp_number")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant || tenant.id !== session.tenantId) {
    redirect("/admin/login");
  }

  const user = await getTenantUserById(session.tenantUserId);
  if (!user || !user.is_active || user.tenant_id !== tenant.id) {
    redirect("/admin/login");
  }

  return { tenant, user };
}

export async function applyAdminSessionCookie(response: NextResponse, user: TenantUserRow, tenantSlug?: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, buildAdminSessionForUser(user), sessionCookieOptions());
  if (tenantSlug) {
    applyAdminTenantCookie(response, tenantSlug);
  }
  return response;
}

export async function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  clearAdminTenantCookie(response);
  return response;
}
