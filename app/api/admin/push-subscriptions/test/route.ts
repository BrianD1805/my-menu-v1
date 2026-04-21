import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { sendAdminPushForTenant } from "@/lib/web-push";

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const result = await sendAdminPushForTenant(auth.tenant.id, {
    title: "Orduva Admin",
    body: "Real push test sent to installed admin devices.",
    url: "/admin/orders",
    tag: "orduva-admin-real-test",
  });

  if (!result.ok) {
    const message =
      result.reason === "missing_vapid"
        ? "VAPID keys are not configured yet."
        : result.reason === "no_subscriptions"
          ? "No active admin push subscriptions found for this tenant."
          : "Real push could not be delivered.";

    return NextResponse.json({ error: message, ...result }, { status: 400 });
  }

  return NextResponse.json({ message: `Real push sent to ${result.sent} admin device(s).`, ...result });
}
