import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";
import {
  DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT,
  DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT,
  buildAffiliateAccessKey,
  buildAffiliateCode,
  buildAffiliateShareUrl,
  normaliseAffiliateCode,
  safeAffiliateText,
} from "@/lib/affiliates";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  const [applicationsResult, partnersResult, tenantsResult] = await Promise.all([
    db.from("affiliate_applications").select("id, applicant_name, email, phone, country, payout_currency_code, earning_region, earning_region_other, website_url, audience_notes, promotion_plan, ref_tenant_slug, referring_tenant_id, status, owner_notes, created_at, updated_at").order("created_at", { ascending: false }).limit(200),
    db.from("affiliate_partners").select("id, application_id, display_name, email, phone, country, payout_currency_code, earning_region, earning_region_other, website_url, tracking_code, access_key, status, affiliate_reward_rate_percent, referring_tenant_id, referring_tenant_slug, tenant_reward_rate_percent, created_at, updated_at").order("created_at", { ascending: false }).limit(200),
    db.from("tenants").select("id, name, slug").limit(500),
  ]);

  if (applicationsResult.error) return jsonNoStore({ error: "Could not load affiliate applications. Run the Ver-0.206 and Ver-0.206A Supabase SQL first." }, { status: 500 });
  if (partnersResult.error) return jsonNoStore({ error: "Could not load affiliate partners. Run the Ver-0.206 and Ver-0.206A Supabase SQL first." }, { status: 500 });
  if (tenantsResult.error) return jsonNoStore({ error: "Could not load tenants." }, { status: 500 });

  return jsonNoStore({ applications: applicationsResult.data || [], partners: partnersResult.data || [], tenants: tenantsResult.data || [] });
}

export async function PATCH(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();
    const applicationId = String(body?.applicationId || "").trim();
    const partnerId = String(body?.partnerId || "").trim();

    if (action === "approve") {
      if (!applicationId) return jsonNoStore({ error: "Application id is required." }, { status: 400 });
      const { data: application, error: applicationError } = await db
        .from("affiliate_applications")
        .select("id, applicant_name, email, phone, country, payout_currency_code, earning_region, earning_region_other, website_url, ref_tenant_slug, referring_tenant_id, status")
        .eq("id", applicationId)
        .maybeSingle();
      if (applicationError || !application) return jsonNoStore({ error: "Affiliate application was not found." }, { status: 404 });

      const trackingCode = normaliseAffiliateCode(body?.trackingCode) || buildAffiliateCode(application.applicant_name, application.email);
      const accessKey = String(body?.accessKey || "").trim() || buildAffiliateAccessKey();
      const affiliateRate = Number(body?.affiliateRewardRatePercent || DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT);
      const tenantRate = Number(body?.tenantRewardRatePercent || DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT);

      const { data: partner, error: partnerError } = await db
        .from("affiliate_partners")
        .upsert(
          {
            application_id: application.id,
            display_name: safeAffiliateText(application.applicant_name, 120) || "Affiliate partner",
            email: application.email,
            phone: application.phone,
            country: application.country,
            payout_currency_code: application.payout_currency_code || application.country || "GBP",
            earning_region: application.earning_region || null,
            earning_region_other: application.earning_region_other || null,
            website_url: application.website_url,
            tracking_code: trackingCode,
            access_key: accessKey,
            status: "active",
            affiliate_reward_rate_percent: affiliateRate,
            referring_tenant_id: application.referring_tenant_id || null,
            referring_tenant_slug: application.ref_tenant_slug || null,
            tenant_reward_rate_percent: tenantRate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tracking_code" },
        )
        .select("id, display_name, email, tracking_code, access_key, status, affiliate_reward_rate_percent, referring_tenant_id, referring_tenant_slug, tenant_reward_rate_percent, payout_currency_code, earning_region, earning_region_other")
        .single();
      if (partnerError || !partner) return jsonNoStore({ error: partnerError?.message || "Could not approve affiliate." }, { status: 500 });

      await db.from("referral_sources").upsert(
        {
          referral_code: trackingCode,
          referrer_type: "public_affiliate",
          affiliate_id: partner.id,
          referrer_tenant_id: null,
          display_name: partner.display_name,
          status: "active",
          reward_rate_percent: affiliateRate,
          updated_at: new Date().toISOString(),
          metadata: {
            affiliate_id: partner.id,
            referring_tenant_id: partner.referring_tenant_id || null,
            referring_tenant_slug: partner.referring_tenant_slug || null,
            tenant_reward_rate_percent: tenantRate,
          },
        },
        { onConflict: "referral_code" },
      );

      await db.from("affiliate_applications").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", application.id);
      return jsonNoStore({ ok: true, partner: { ...partner, shareUrl: buildAffiliateShareUrl(partner.tracking_code) } });
    }

    if (action === "decline") {
      if (!applicationId) return jsonNoStore({ error: "Application id is required." }, { status: 400 });
      const { error } = await db.from("affiliate_applications").update({ status: "declined", owner_notes: safeAffiliateText(body?.ownerNotes, 1000), updated_at: new Date().toISOString() }).eq("id", applicationId);
      if (error) return jsonNoStore({ error: error.message || "Could not decline application." }, { status: 500 });
      return jsonNoStore({ ok: true });
    }

    if (action === "partner-status") {
      if (!partnerId) return jsonNoStore({ error: "Partner id is required." }, { status: 400 });
      const status = String(body?.status || "active").toLowerCase();
      if (!["active", "paused", "cancelled"].includes(status)) return jsonNoStore({ error: "Invalid partner status." }, { status: 400 });
      const { data: partner, error } = await db.from("affiliate_partners").update({ status, updated_at: new Date().toISOString() }).eq("id", partnerId).select("tracking_code").maybeSingle();
      if (error) return jsonNoStore({ error: error.message || "Could not update affiliate partner." }, { status: 500 });
      if (partner?.tracking_code) {
        await db.from("referral_sources").update({ status: status === "active" ? "active" : status === "paused" ? "paused" : "cancelled", updated_at: new Date().toISOString() }).eq("referral_code", partner.tracking_code);
      }
      return jsonNoStore({ ok: true });
    }

    return jsonNoStore({ error: "Unsupported affiliate action." }, { status: 400 });
  } catch (error) {
    return jsonNoStore({ error: error instanceof Error ? error.message : "Could not update affiliates." }, { status: 500 });
  }
}
