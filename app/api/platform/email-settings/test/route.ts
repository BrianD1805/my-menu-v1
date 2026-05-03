import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getOnboardingEmailRuntimeStatus,
  sendOwnerEmailSettingsTest,
} from "@/lib/onboarding-email";

function getPlatformKey() {
  return (
    process.env.ORDUVA_PLATFORM_ACCESS_KEY ||
    process.env.ADMIN_ACCESS_KEY ||
    ""
  ).trim();
}

function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = (req.headers.get("x-orduva-platform-key") || "").trim();
  if (!expected || supplied !== expected) {
    return NextResponse.json(
      { error: "Platform access key required" },
      { status: 401 },
    );
  }
  return null;
}

async function getReferenceTenant() {
  const { data: zimza } = await db
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "zimzaexpress")
    .maybeSingle();

  if (zimza) return zimza;

  const { data: latest } = await db
    .from("tenants")
    .select("id, name, slug")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latest || null;
}

export async function GET(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  const tenant = await getReferenceTenant();

  return NextResponse.json({
    status: getOnboardingEmailRuntimeStatus(),
    tenant: tenant
      ? {
          name: tenant.name,
          slug: tenant.slug,
          storeAddress: `${tenant.slug}.orduva.com`,
        }
      : {
          name: "Orduva platform",
          slug: "platform",
          storeAddress: "www.orduva.com",
        },
  });
}

export async function POST(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  let body: { recipient?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const tenant = await getReferenceTenant();
  if (!tenant) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        message:
          "Create at least one store before sending the logged owner email test.",
        status: getOnboardingEmailRuntimeStatus(),
      },
      { status: 400 },
    );
  }

  const result = await sendOwnerEmailSettingsTest({
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    requestedBy: "Orduva owner platform",
    recipient: body.recipient,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.skipped ? 400 : 502,
  });
}
