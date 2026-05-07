import { NextResponse } from "next/server";
import { getPlatformSecuritySettings, requirePlatformKey } from "@/lib/platform-security";

export async function GET(req: Request) {
  const keyError = requirePlatformKey(req);
  if (keyError) return keyError;

  const settings = await getPlatformSecuritySettings().catch(() => null);
  return NextResponse.json({
    ok: true,
    twoFactorEnabled: Boolean(settings?.totp_enabled && settings?.totp_secret),
    confirmedAt: settings?.totp_confirmed_at || null,
    setupAvailable: true,
  });
}
