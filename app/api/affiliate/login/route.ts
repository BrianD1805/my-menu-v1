import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildAffiliateShareUrl, normaliseAffiliateEmail } from "@/lib/affiliates";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normaliseAffiliateEmail(body?.email);
    const accessKey = String(body?.accessKey || "").trim();
    if (!email || !accessKey) return jsonNoStore({ error: "Email and affiliate login key are required." }, { status: 400 });

    const { data: partner, error } = await db
      .from("affiliate_partners")
      .select("id, display_name, email, tracking_code, status, affiliate_reward_rate_percent, tenant_reward_rate_percent")
      .eq("email", email)
      .eq("access_key", accessKey)
      .maybeSingle();

    if (error || !partner || partner.status !== "active") return jsonNoStore({ error: "Affiliate login was not recognised, or this partner is not active." }, { status: 401 });

    return jsonNoStore({
      partner: {
        id: partner.id,
        displayName: partner.display_name,
        email: partner.email,
        trackingCode: partner.tracking_code,
        shareUrl: buildAffiliateShareUrl(partner.tracking_code),
        affiliateRewardRatePercent: partner.affiliate_reward_rate_percent,
        tenantRewardRatePercent: partner.tenant_reward_rate_percent,
      },
    });
  } catch (error) {
    return jsonNoStore({ error: error instanceof Error ? error.message : "Affiliate login failed." }, { status: 500 });
  }
}
