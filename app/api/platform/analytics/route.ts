import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { buildAnalyticsSummary } from "@/lib/analytics";

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const summary = await buildAnalyticsSummary({ ownerWide: true, days: 30 });
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load platform analytics." }, { status: 500 });
  }
}
