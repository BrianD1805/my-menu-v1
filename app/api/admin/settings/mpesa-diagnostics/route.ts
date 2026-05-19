import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";
import {
  createPaidOrderFromPesapalIntent,
  fetchPesapalTransactionStatusDetail,
  getString,
  isCompletedStatus,
  isFailedStatus,
  loadPesapalIntentByCheckout,
} from "@/lib/storefront-pesapal";

function normalizeAction(value: unknown) {
  const action = String(value || "check").trim().toLowerCase();
  return ["check", "create_order", "mark_failed"].includes(action) ? action : "check";
}

function summarizeIntent(intent: Record<string, any> | null) {
  if (!intent) return null;
  return {
    id: intent.id || null,
    status: intent.status || null,
    orderId: intent.order_id || null,
    provider: intent.provider || null,
    amountTotal: intent.amount_total ?? null,
    currencyCode: intent.currency_code || null,
    customerName: intent.customer_name || null,
    customerPhone: intent.customer_phone || null,
    pesapalOrderTrackingId: intent.pesapal_order_tracking_id || null,
    pesapalMerchantReference: intent.pesapal_merchant_reference || null,
    createdAt: intent.created_at || null,
    updatedAt: intent.updated_at || null,
  };
}

export async function POST(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;

    const body = await req.json().catch(() => ({}));
    const action = normalizeAction(body?.action);
    const checkoutId = getString(body?.checkoutId);
    const orderTrackingId = getString(body?.orderTrackingId);
    const merchantReference = getString(body?.merchantReference);

    if (!checkoutId && !orderTrackingId && !merchantReference) {
      return NextResponse.json({ error: "Enter a checkout ID, Pesapal OrderTrackingId or merchant reference." }, { status: 400 });
    }

    let intent = await loadPesapalIntentByCheckout({ checkoutId, orderTrackingId, merchantReference });
    if (!intent && orderTrackingId && !checkoutId) intent = await loadPesapalIntentByCheckout({ checkoutId: orderTrackingId });
    if (!intent && checkoutId && !orderTrackingId) intent = await loadPesapalIntentByCheckout({ orderTrackingId: checkoutId });
    if (!intent || String(intent.tenant_id) !== tenantLookup.tenant.id) {
      return NextResponse.json({ error: "No matching M-Pesa/Pesapal payment intent was found for this tenant." }, { status: 404 });
    }

    const pesapal = await fetchPesapalTransactionStatusDetail({ intent });
    const statusValue = pesapal.statusCode ?? pesapal.status;
    const completed = isCompletedStatus(statusValue);
    const failed = isFailedStatus(statusValue);
    let message = completed
      ? "Pesapal reports this payment as completed. It is safe to reconcile into an order."
      : failed
        ? "Pesapal does not report this payment as completed. Do not create an order unless Pesapal support confirms it."
        : "Pesapal still appears pending or unclear. Check again later or contact Pesapal support.";
    let orderId = intent.order_id || null;

    if (action === "create_order") {
      if (intent.order_id) {
        message = "This payment intent already has an Orduva order linked.";
      } else if (!completed) {
        return NextResponse.json(
          {
            error: "Order creation blocked because Pesapal has not returned COMPLETED for this payment.",
            intent: summarizeIntent(intent),
            pesapal,
            safeToCreateOrder: false,
            message,
          },
          { status: 409 },
        );
      } else {
        orderId = await createPaidOrderFromPesapalIntent({
          intent,
          paymentId: getString(intent.pesapal_order_tracking_id),
          paymentReference: pesapal.confirmationCode || getString(intent.pesapal_order_tracking_id) || getString(intent.pesapal_merchant_reference),
          paymentMethod: pesapal.paymentMethod,
          paidAt: new Date().toISOString(),
        });
        message = "Order created from confirmed Pesapal payment.";
      }
    }

    if (action === "mark_failed") {
      if (intent.order_id) {
        return NextResponse.json({ error: "This payment already has an order linked and cannot be marked failed here." }, { status: 409 });
      }
      if (completed) {
        return NextResponse.json({ error: "Pesapal reports this payment as completed, so it cannot be marked failed." }, { status: 409 });
      }
      const { data: updatedRows, error: updateError } = await db
        .from("storefront_payment_intents")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", intent.id)
        .eq("tenant_id", tenantLookup.tenant.id)
        .is("order_id", null)
        .select("id,status,updated_at");

      if (updateError) {
        console.error("Admin M-Pesa/Pesapal diagnostics status update failed", updateError);
        return NextResponse.json(
          {
            error: `Could not update payment intent status: ${updateError.message}`,
            intent: summarizeIntent(intent),
            pesapal,
            safeToCreateOrder: false,
            completed,
            failed,
          },
          { status: 500 },
        );
      }

      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json(
          {
            error: "No payment intent row was updated. It may already have an order linked, or it may no longer belong to this tenant.",
            intent: summarizeIntent(intent),
            pesapal,
            safeToCreateOrder: false,
            completed,
            failed,
          },
          { status: 409 },
        );
      }

      message = "Payment intent marked failed for admin review. No order was created because Pesapal has not returned COMPLETED.";
    }

    const latest = await loadPesapalIntentByCheckout({ checkoutId: String(intent.id) });
    return NextResponse.json({
      ok: true,
      action,
      intent: summarizeIntent(latest || intent),
      pesapal,
      safeToCreateOrder: completed,
      completed,
      failed,
      orderId,
      message,
    });
  } catch (error) {
    console.error("Admin M-Pesa/Pesapal diagnostics failed", error);
    const message = error instanceof Error ? error.message : "Could not check M-Pesa/Pesapal status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
