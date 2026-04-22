import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveTenantSlug, resolveTenantSlugFromRequest, getTenantBySlug } from "@/lib/tenant-server";

export const CUSTOMER_SESSION_COOKIE = "orduva_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const HASH_PREFIX = "scrypt";

type SessionPayload = {
  customerId: string;
  tenantId: string;
  exp: number;
};

type CustomerAccountRow = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  password_hash: string;
  is_active: boolean;
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

export function normalizeCustomerEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function hashCustomerPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyCustomerPassword(password: string, storedHash: string | null | undefined) {
  const value = String(storedHash || "");
  const [prefix, salt, hash] = value.split("$");
  if (prefix !== HASH_PREFIX || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  if (candidate.length !== target.length) return false;
  return timingSafeEqual(candidate, target);
}

function createSessionToken(payload: SessionPayload) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

function readSessionToken(token: string | null | undefined): SessionPayload | null {
  const value = String(token || "").trim();
  if (!value || !getAuthSecret()) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  if (sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionPayload;
    if (!payload?.customerId || !payload?.tenantId || !payload?.exp) return null;
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

export function buildCustomerSessionForUser(user: CustomerAccountRow) {
  return createSessionToken({
    customerId: user.id,
    tenantId: user.tenant_id,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export async function getCustomerByEmail(tenantId: string, email: string) {
  const normalizedEmail = normalizeCustomerEmail(email);
  const { data, error } = await db
    .from("customer_accounts")
    .select("id, tenant_id, email, full_name, phone, address_line_1, address_line_2, city, postcode, password_hash, is_active")
    .eq("tenant_id", tenantId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomerAccountRow;
}

export async function getCustomerById(customerId: string) {
  const { data, error } = await db
    .from("customer_accounts")
    .select("id, tenant_id, email, full_name, phone, address_line_1, address_line_2, city, postcode, password_hash, is_active")
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomerAccountRow;
}

export async function validateCustomerRequestSession(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`))
    ?.slice(CUSTOMER_SESSION_COOKIE.length + 1);

  const session = readSessionToken(token);
  if (!session) return null;

  const tenantSlug = resolveTenantSlugFromRequest(req);
  if (!tenantSlug) return null;

  const tenant = await getTenantBySlug(tenantSlug);
  if (tenant.id !== session.tenantId) return null;

  const user = await getCustomerById(session.customerId);
  if (!user || !user.is_active) return null;

  return { tenant, user };
}

export async function getCustomerPageSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return null;

  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);
  if (tenant.id !== session.tenantId) return null;

  const user = await getCustomerById(session.customerId);
  if (!user || !user.is_active) return null;

  return { tenant, user };
}

export async function requireCustomerPageSession() {
  const session = await getCustomerPageSession();
  if (!session) {
    redirect("/account/login");
  }
  return session;
}

export function applyCustomerSession(response: NextResponse, user: CustomerAccountRow) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, buildCustomerSessionForUser(user), sessionCookieOptions());
  return response;
}

export function clearCustomerSession(response: NextResponse) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
