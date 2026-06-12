import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

function extractItemsSummary(raw: any): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const name = item?.product_name || item?.name || item?.productName || item?.title || "";
      const qty = Number(item?.quantity || 0);
      return name ? `${qty > 0 ? `${qty} × ` : ""}${name}` : "";
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await db
    .from("orders")
    .select(
      `
      id,
      created_at,
      total,
      subtotal_total,
      status,
      order_type,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      payment_provider,
      payment_method_label,
      payment_status,
      payment_reference,
      paid_at,
      order_flow,
      preorder_status,
      preorder_deposit_amount,
      preorder_balance_amount,
      preorder_balance_payment_status,
      preorder_balance_paid_at,
      reward_tier,
      reward_discount_amount,
      discount_code,
      discount_name,
      discount_amount,
      customer_receipt_number,
      customer_receipt_download_count,
      order_items (
        product_name,
        quantity,
        line_total
      )
    `
    )
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load orders." }, { status: 500 });
  }

  const orders = (data || []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    total: Number(row.total || 0),
    subtotal: Number(row.subtotal_total ?? row.total ?? 0),
    status: row.status || "new",
    orderType: row.order_type || null,
    customerName: row.customer_name || null,
    customerPhone: row.customer_phone || null,
    notes: row.notes || null,
    address: row.customer_address || null,
    paymentMethodLabel: row.payment_method_label || row.payment_provider || null,
    paymentStatus: row.payment_status || null,
    paymentReference: row.payment_reference || null,
    paidAt: row.paid_at || null,
    orderFlow: row.order_flow || "standard",
    preorderStatus: row.preorder_status || null,
    preorderDepositAmount: Number(row.preorder_deposit_amount || 0),
    preorderBalanceAmount: Number(row.preorder_balance_amount || 0),
    preorderBalancePaymentStatus: row.preorder_balance_payment_status || null,
    preorderBalancePaidAt: row.preorder_balance_paid_at || null,
    rewardTier: row.reward_tier || null,
    rewardDiscountAmount: Number(row.reward_discount_amount || 0),
    discountCode: row.discount_code || null,
    discountName: row.discount_name || null,
    discountAmount: Number(row.discount_amount || 0),
    receiptNumber: row.customer_receipt_number || `ORD-${String(row.id || "").slice(0, 8).toUpperCase()}`,
    receiptDownloadCount: Number(row.customer_receipt_download_count || 0),
    receiptUrl: `/api/customer/orders/${row.id}/receipt`,
    itemsSummary: extractItemsSummary(row.order_items),
  }));

  return NextResponse.json({ ok: true, orders });
}
