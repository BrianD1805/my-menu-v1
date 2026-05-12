import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { looksLikeAffiliateEmail, normaliseAffiliateEmail, safeAffiliateText } from "@/lib/affiliates";

type Window = { count: number; resetAt: number };
const WINDOWS = new Map<string, Window>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const MIN_FORM_MS = 3000;

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = WINDOWS.get(key);
  if (!current || current.resetAt < now) {
    WINDOWS.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function cleanSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) return jsonNoStore({ error: "Too many affiliate applications from this connection. Please try again later." }, { status: 429 });
    if (String(body?.website || "").trim()) return jsonNoStore({ error: "Unable to submit application." }, { status: 400 });
    const formStartedAt = Number(body?.formStartedAt || 0);
    if (!formStartedAt || Date.now() - formStartedAt < MIN_FORM_MS) return jsonNoStore({ error: "Please take a moment to complete the form before submitting." }, { status: 400 });

    const applicantName = safeAffiliateText(body?.applicantName, 120);
    const email = normaliseAffiliateEmail(body?.email);
    const phone = safeAffiliateText(body?.phone, 80);
    const country = safeAffiliateText(body?.country, 80);
    const websiteUrl = safeAffiliateText(body?.websiteUrl, 300);
    const audienceNotes = safeAffiliateText(body?.audienceNotes, 1200);
    const promotionPlan = safeAffiliateText(body?.promotionPlan, 1200);
    const refTenantSlug = cleanSlug(body?.refTenant);

    if (!applicantName) return jsonNoStore({ error: "Your name is required." }, { status: 400 });
    if (!email || !looksLikeAffiliateEmail(email)) return jsonNoStore({ error: "Please enter a valid email address." }, { status: 400 });
    if (!audienceNotes || !promotionPlan) return jsonNoStore({ error: "Please tell us who you would promote Orduva to and how you would share it." }, { status: 400 });

    let referringTenantId: string | null = null;
    if (refTenantSlug) {
      const { data: tenant } = await db.from("tenants").select("id").eq("slug", refTenantSlug).maybeSingle();
      referringTenantId = tenant?.id || null;
    }

    const { data, error } = await db
      .from("affiliate_applications")
      .insert({
        applicant_name: applicantName,
        email,
        phone,
        country,
        website_url: websiteUrl,
        audience_notes: audienceNotes,
        promotion_plan: promotionPlan,
        ref_tenant_slug: refTenantSlug || null,
        referring_tenant_id: referringTenantId,
        status: "pending",
        metadata: {
          landing_url: safeAffiliateText(body?.landingUrl, 500),
          client_ip: safeAffiliateText(clientIp, 80),
          user_agent: safeAffiliateText(req.headers.get("user-agent"), 500),
        },
      })
      .select("id")
      .single();

    if (error) return jsonNoStore({ error: error.message || "Could not submit affiliate application." }, { status: 500 });
    return jsonNoStore({ ok: true, applicationId: data?.id || null });
  } catch (error) {
    return jsonNoStore({ error: error instanceof Error ? error.message : "Could not submit affiliate application." }, { status: 500 });
  }
}
