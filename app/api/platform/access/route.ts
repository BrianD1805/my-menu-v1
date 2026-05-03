import { NextResponse } from "next/server";

function getPlatformKey() {
  return (
    process.env.ORDUVA_PLATFORM_ACCESS_KEY ||
    process.env.ADMIN_ACCESS_KEY ||
    ""
  ).trim();
}

function getSuppliedKey(req: Request) {
  return (req.headers.get("x-orduva-platform-key") || "").trim();
}

export async function POST(req: Request) {
  const expected = getPlatformKey();
  const supplied = getSuppliedKey(req);

  if (!expected || supplied !== expected) {
    return NextResponse.json(
      { ok: false, error: "Owner platform access key required" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
