import { createHash, createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const PLATFORM_SECURITY_ROW_ID = "owner";
export const PLATFORM_2FA_SESSION_HOURS = 12;

type PlatformSecurityRow = {
  id: string;
  totp_enabled: boolean | null;
  totp_secret: string | null;
  totp_confirmed_at?: string | null;
};

export function getPlatformKey() {
  return (process.env.ORDUVA_PLATFORM_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || "").trim();
}

export function getSuppliedPlatformKey(req: Request) {
  return (req.headers.get("x-orduva-platform-key") || "").trim();
}

export function getSuppliedPlatformSession(req: Request) {
  return (req.headers.get("x-orduva-platform-2fa-session") || "").trim();
}

export function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = getSuppliedPlatformKey(req);
  if (!expected || supplied !== expected) {
    return NextResponse.json({ error: "Platform access key required" }, { status: 401 });
  }
  return null;
}

export async function getPlatformSecuritySettings(): Promise<PlatformSecurityRow | null> {
  const { data } = await db
    .from("platform_security")
    .select("id, totp_enabled, totp_secret, totp_confirmed_at")
    .eq("id", PLATFORM_SECURITY_ROW_ID)
    .maybeSingle();
  return (data as PlatformSecurityRow | null) || null;
}

export async function isPlatformTwoFactorEnabled() {
  try {
    const settings = await getPlatformSecuritySettings();
    return Boolean(settings?.totp_enabled && settings?.totp_secret);
  } catch {
    return false;
  }
}

export function base32Encode(buffer: Buffer) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += alphabet[parseInt(chunk, 2)];
  }
  return output;
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value >= 0) bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, window = 1) {
  const cleanCode = String(code || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let offset = -window; offset <= window; offset += 1) {
    if (hotp(secret, counter + offset) === cleanCode) return true;
  }
  return false;
}

export function buildOtpAuthUrl(secret: string) {
  const label = encodeURIComponent("Orduva:Owner Platform");
  const issuer = encodeURIComponent("Orduva");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPlatformTwoFactorSession() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PLATFORM_2FA_SESSION_HOURS * 60 * 60 * 1000).toISOString();
  await db.from("platform_security_sessions").insert({ token_hash: tokenHash, expires_at: expiresAt });
  return { token, expiresAt };
}

export async function isValidPlatformTwoFactorSession(token: string) {
  if (!token) return false;
  try {
    const { data } = await db
      .from("platform_security_sessions")
      .select("id, expires_at, revoked_at")
      .eq("token_hash", hashToken(token))
      .maybeSingle();
    if (!data || data.revoked_at) return false;
    return new Date(data.expires_at).getTime() > Date.now();
  } catch {
    return false;
  }
}

export async function requirePlatformAccess(req: Request) {
  const keyError = requirePlatformKey(req);
  if (keyError) return keyError;
  const twoFactorEnabled = await isPlatformTwoFactorEnabled();
  if (!twoFactorEnabled) return null;
  const token = getSuppliedPlatformSession(req);
  const validSession = await isValidPlatformTwoFactorSession(token);
  if (!validSession) {
    return NextResponse.json({ error: "Platform authenticator code required", requiresTwoFactor: true }, { status: 401 });
  }
  return null;
}
