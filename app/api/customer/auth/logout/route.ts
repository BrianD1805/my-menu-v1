import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customer-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearCustomerSession(response);
}
