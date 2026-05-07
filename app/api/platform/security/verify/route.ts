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

  if (!settings?.totp_enabled || !settings?.totp_secret) {
    return NextResponse.json({ ok: true, twoFactorEnabled: false });
  }

  if (!verifyTotpCode(settings.totp_secret, code)) {
    return NextResponse.json({ error: "That authenticator code was not accepted." }, { status: 401 });
  }

  await db.from("platform_security").update({
    totp_last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", PLATFORM_SECURITY_ROW_ID);

  const session = await createPlatformTwoFactorSession();
  return NextResponse.json({ ok: true, twoFactorEnabled: true, sessionToken: session.token, sessionExpiresAt: session.expiresAt });
}
