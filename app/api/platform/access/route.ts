import { NextResponse } from "next/server";
import {
  getPlatformSecuritySettings,
  getSuppliedPlatformSession,
  isValidPlatformTwoFactorSession,
  requirePlatformKey,
} from "@/lib/platform-security";

export async function POST(req: Request) {
  const keyError = requirePlatformKey(req);
  if (keyError) return keyError;

  const settings = await getPlatformSecuritySettings().catch(() => null);
  const twoFactorEnabled = Boolean(settings?.totp_enabled && settings?.totp_secret);

  if (!twoFactorEnabled) {
    return NextResponse.json({ ok: true, requiresTwoFactor: false, twoFactorEnabled: false });
  }

  const sessionToken = getSuppliedPlatformSession(req);
  const validSession = await isValidPlatformTwoFactorSession(sessionToken);
  if (validSession) {
    return NextResponse.json({ ok: true, requiresTwoFactor: false, twoFactorEnabled: true });
  }

  return NextResponse.json({ ok: true, requiresTwoFactor: true, twoFactorEnabled: true });
}
