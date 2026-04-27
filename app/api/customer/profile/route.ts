import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

export async function PATCH(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, string | null> = {};

  if (Object.prototype.hasOwnProperty.call(body, "fullName")) {
    payload.full_name = String(body.fullName || "").trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    payload.phone = String(body.phone || "").trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "checkoutAddress")) {
    payload.address_line_1 = String(body.checkoutAddress || "").trim() || null;
    payload.address_line_2 = null;
    payload.city = null;
    payload.postcode = null;
  } else {
    if (Object.prototype.hasOwnProperty.call(body, "addressLine1")) {
      payload.address_line_1 = String(body.addressLine1 || "").trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "addressLine2")) {
      payload.address_line_2 = String(body.addressLine2 || "").trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "city")) {
      payload.city = String(body.city || "").trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "postcode")) {
      payload.postcode = String(body.postcode || "").trim() || null;
    }
  }

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "No profile details supplied." }, { status: 400 });
  }

  const { data, error } = await db
    .from("customer_accounts")
    .update(payload)
    .eq("id", session.user.id)
    .select("id, email, full_name, phone, address_line_1, address_line_2, city, postcode")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not update customer profile." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    customer: {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      phone: data.phone,
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2,
      city: data.city,
      postcode: data.postcode,
    },
  });
}
