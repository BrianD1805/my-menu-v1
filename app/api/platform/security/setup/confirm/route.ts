import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PLATFORM_SECURITY_ROW_ID,
  createPlatformTwoFactorSession,
  getPlatformSecuritySettings,
  requirePlatformKey,
  verifyTotpCode,
} from "@/lib/platform-security";

export async function POST(req: Request) {
  const keyError = requirePlatformKey(req);
  if (keyError) return keyError;

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code || "");
  const settings = await getPlatformSecuritySettings().catch(() => null);
  const secret = settings?.totp_secret || "";

  if (!secret) return NextResponse.json({ error: "Start authenticator setup first." }, { status: 400 });
  if (!verifyTotpCode(secret, code)) return NextResponse.json({ error: "That authenticator code was not accepted." }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await db.from("platform_security").update({
    totp_enabled: true,
    totp_confirmed_at: now,
    totp_last_verified_at: now,
    updated_at: now,
  }).eq("id", PLATFORM_SECURITY_ROW_ID);

  if (error) return NextResponse.json({ error: "Could not enable authenticator." }, { status: 500 });

  const session = await createPlatformTwoFactorSession();
  return NextResponse.json({ ok: true, twoFactorEnabled: true, sessionToken: session.token, sessionExpiresAt: session.expiresAt });
}
