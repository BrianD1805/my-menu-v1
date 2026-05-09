import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { getAllStripePriceConfigStatuses } from "@/lib/stripe-checkout";

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  const prices = getAllStripePriceConfigStatuses();
  const configuredCount = prices.filter((price) => price.configured).length;
  const missing = prices.filter((price) => !price.configured).map((price) => price.envKey);

  const response = NextResponse.json({
    total: prices.length,
    configuredCount,
    missingCount: missing.length,
    prices,
    missing,
  });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}
