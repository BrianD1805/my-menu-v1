import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

export async function PATCH(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const payload = {
    full_name: String(body.fullName || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    address_line_1: String(body.addressLine1 || "").trim() || null,
    address_line_2: String(body.addressLine2 || "").trim() || null,
    city: String(body.city || "").trim() || null,
    postcode: String(body.postcode || "").trim() || null,
  };

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
