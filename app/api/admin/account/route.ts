import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApiUser, normalizeOwnerEmail, verifyOwnerPassword } from "@/lib/admin-auth";
import { normalizeOptionalText } from "@/lib/tenant-settings";

function clean(value: unknown, max = 240) {
  return normalizeOptionalText(value, max);
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const fullName = clean(body?.fullName, 120);
    const nextEmail = normalizeOwnerEmail(body?.email);
    if (!nextEmail || !nextEmail.includes("@")) {
      return NextResponse.json({ error: "Enter a valid login email." }, { status: 400 });
    }

    const currentEmail = normalizeOwnerEmail(auth.user.email);
    if (nextEmail !== currentEmail) {
      const currentPassword = String(body?.currentPasswordForEmail || "");
      const { data: currentUser } = await db
        .from("tenant_users")
        .select("id, password_hash")
        .eq("id", auth.user.id)
        .eq("tenant_id", auth.tenant.id)
        .single();
      if (!currentUser || !verifyOwnerPassword(currentPassword, String(currentUser.password_hash || ""))) {
        return NextResponse.json({ error: "Enter your current password to change the login email." }, { status: 400 });
      }

      const { data: duplicate } = await db
        .from("tenant_users")
        .select("id")
        .eq("tenant_id", auth.tenant.id)
        .eq("email", nextEmail)
        .neq("id", auth.user.id)
        .maybeSingle();
      if (duplicate) {
        return NextResponse.json({ error: "Another admin user already uses that email for this tenant." }, { status: 409 });
      }
    }

    const { error: userError } = await db
      .from("tenant_users")
      .update({ full_name: fullName, email: nextEmail })
      .eq("id", auth.user.id)
      .eq("tenant_id", auth.tenant.id);
    if (userError) throw userError;

    const payload = {
      tenant_id: auth.tenant.id,
      account_business_legal_name: clean(body?.legalBusinessName, 180),
      account_contact_name: clean(body?.contactName, 120),
      account_phone: clean(body?.accountPhone, 80),
      account_email: clean(body?.accountEmail, 160),
      account_address_line_1: clean(body?.accountAddressLine1, 180),
      account_address_line_2: clean(body?.accountAddressLine2, 180),
      account_city: clean(body?.accountCity, 100),
      account_region: clean(body?.accountRegion, 100),
      account_postcode: clean(body?.accountPostcode, 40),
      account_country: clean(body?.accountCountry, 100),
      ship_from_name: clean(body?.shipFromName, 160),
      ship_from_address_line_1: clean(body?.shipFromAddressLine1, 180),
      ship_from_address_line_2: clean(body?.shipFromAddressLine2, 180),
      ship_from_city: clean(body?.shipFromCity, 100),
      ship_from_region: clean(body?.shipFromRegion, 100),
      ship_from_postcode: clean(body?.shipFromPostcode, 40),
      ship_from_country: clean(body?.shipFromCountry, 100),
    };

    const { error: settingsError } = await db
      .from("tenant_settings")
      .upsert(payload, { onConflict: "tenant_id" });
    if (settingsError) throw settingsError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save tenant account details" }, { status: 500 });
  }
}
