import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";
import { normalizeColor, normalizeOptionalText } from "@/lib/tenant-settings";

export async function GET(req: Request) {
  const tenantLookup = await resolveAdminTenant(req);
  if (!tenantLookup.ok) return tenantLookup.error;

  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color")
    .eq("tenant_id", tenantLookup.tenant.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load tenant settings" }, { status: 500 });
  }

  return NextResponse.json({ settings: data || null });
}

export async function PATCH(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;

    const body = await req.json();
    const payload = {
      tenant_id: tenantLookup.tenant.id,
      business_display_name: normalizeOptionalText(body?.businessDisplayName, 120),
      storefront_heading: normalizeOptionalText(body?.storefrontHeading, 160),
      storefront_subheading: normalizeOptionalText(body?.storefrontSubheading, 400),
      admin_heading_label: normalizeOptionalText(body?.adminHeadingLabel, 120),
      logo_url: normalizeOptionalText(body?.logoUrl, 500),
      primary_color: normalizeColor(body?.primaryColor),
      accent_color: normalizeColor(body?.accentColor),
    };

    const { data, error } = await db
      .from("tenant_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select("tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to save tenant settings" }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save tenant settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
