import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PLATFORM_SECURITY_ROW_ID,
  buildOtpAuthUrl,
  generateTotpSecret,
  getPlatformSecuritySettings,
  requirePlatformKey,
} from "@/lib/platform-security";

export async function POST(req: Request) {
  const keyError = requirePlatformKey(req);
  if (keyError) return keyError;

  const current = await getPlatformSecuritySettings().catch(() => null);
  if (current?.totp_enabled && current?.totp_secret) {
    return NextResponse.json({ error: "Authenticator is already enabled." }, { status: 409 });
  }

  const secret = generateTotpSecret();
  const { error } = await db.from("platform_security").upsert({
    id: PLATFORM_SECURITY_ROW_ID,
    totp_enabled: false,
    totp_secret: secret,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message || "Could not start authenticator setup." }, { status: 500 });

  return NextResponse.json({ ok: true, secret, otpauthUrl: buildOtpAuthUrl(secret) });
}
