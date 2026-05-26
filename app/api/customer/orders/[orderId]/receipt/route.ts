import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

type ReceiptParams = {
  params: Promise<{ orderId: string }>;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asMoney(value: unknown, currencyCode: string) {
  const amount = Number(value || 0);
  return `${currencyCode} ${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function asDate(value: unknown) {
  if (!value) return "";
  try {
    return new Date(String(value)).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function shortOrderRef(id: string) {
  return `ORD-${String(id || "").slice(0, 8).toUpperCase()}`;
}

function receiptNumber(row: any) {
  return String(row?.customer_receipt_number || shortOrderRef(row?.id || ""));
}

function buildReceiptHtml({ tenantName, currencyCode, order }: { tenantName: string; currencyCode: string; order: any }) {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const receiptRef = receiptNumber(order);
  const subtotal = Number(order?.subtotal_total ?? order?.total ?? 0);
  const rewardDiscount = Number(order?.reward_discount_amount || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const total = Number(order?.total || 0);
  const hasAdjustments = rewardDiscount > 0 || discountAmount > 0 || subtotal !== total;

  const itemRows = items
    .map((item: any) => {
      const productName = escapeHtml(item?.product_name || "Item");
      const quantity = Number(item?.quantity || 0);
      const unitPrice = asMoney(item?.unit_price, currencyCode);
      const lineTotal = asMoney(item?.line_total, currencyCode);
      return `
        <tr>
          <td>
            <strong>${productName}</strong>
            <span>${quantity} × ${unitPrice}</span>
          </td>
          <td class="amount">${lineTotal}</td>
        </tr>`;
    })
    .join("");

  const discountRows = hasAdjustments
    ? `
      <div class="totals-row subtle"><span>Subtotal</span><strong>${asMoney(subtotal, currencyCode)}</strong></div>
      ${rewardDiscount > 0 ? `<div class="totals-row success"><span>Rewards discount${order?.reward_tier ? ` · ${escapeHtml(order.reward_tier)}` : ""}</span><strong>-${asMoney(rewardDiscount, currencyCode)}</strong></div>` : ""}
      ${discountAmount > 0 ? `<div class="totals-row success"><span>${escapeHtml(order?.discount_name || order?.discount_code || "Discount")}</span><strong>-${asMoney(discountAmount, currencyCode)}</strong></div>` : ""}
    `
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(tenantName)} receipt ${escapeHtml(receiptRef)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8f4f0;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 34px 18px;
    }
    .receipt-shell {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.10);
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 28px 90px rgba(15, 23, 42, 0.12);
      position: relative;
    }
    .receipt-shell::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 6px;
      background: linear-gradient(90deg, rgba(16,185,129,.88), rgba(51,65,85,.74), rgba(16,185,129,.88));
    }
    .header {
      padding: 34px 34px 24px;
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-bottom: 1px solid #e2e8f0;
    }
    .kicker {
      margin: 0;
      color: #047857;
      font-size: 11px;
      letter-spacing: .22em;
      text-transform: uppercase;
      font-weight: 900;
    }
    h1 {
      margin: 8px 0 0;
      font-size: 32px;
      line-height: 1.05;
      letter-spacing: -0.05em;
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 18px;
      align-items: end;
    }
    .receipt-pill {
      border: 1px solid #bbf7d0;
      background: #f0fdf4;
      color: #065f46;
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
    }
    .content { padding: 28px 34px 34px; }
    .details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }
    .card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 22px;
      padding: 16px;
    }
    .label {
      margin: 0;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .18em;
      color: #64748b;
      text-transform: uppercase;
    }
    .value {
      margin: 7px 0 0;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.45;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      display: table;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      padding: 14px 16px;
      text-align: left;
      font-size: 11px;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    td {
      border-top: 1px solid #e2e8f0;
      padding: 16px;
      vertical-align: top;
      font-size: 14px;
    }
    td span { display: block; margin-top: 4px; color: #64748b; font-size: 13px; }
    .amount { text-align: right; font-weight: 900; white-space: nowrap; }
    .totals {
      margin-left: auto;
      margin-top: 20px;
      max-width: 360px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 16px;
      background: #ffffff;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      padding: 9px 0;
      color: #334155;
      font-size: 14px;
    }
    .totals-row + .totals-row { border-top: 1px solid #e2e8f0; }
    .totals-row.success { color: #047857; }
    .totals-row.grand {
      color: #0f172a;
      font-size: 18px;
      font-weight: 950;
    }
    .footer {
      margin-top: 26px;
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
      color: #64748b;
      font-size: 12px;
      line-height: 1.7;
    }
    .print-actions {
      max-width: 760px;
      margin: 18px auto 0;
      display: flex;
      justify-content: center;
      gap: 10px;
    }
    .print-actions button {
      border: 0;
      border-radius: 18px;
      background: #047857;
      color: white;
      font-weight: 900;
      padding: 12px 18px;
      cursor: pointer;
    }
    .print-actions button.secondary { background: #0f172a; }
    @media (max-width: 640px) {
      body { padding: 18px 12px; }
      .header, .content { padding-left: 20px; padding-right: 20px; }
      .header-grid, .details { grid-template-columns: 1fr; }
      .receipt-pill { width: fit-content; }
      h1 { font-size: 26px; }
      .amount { text-align: left; }
      .totals { max-width: none; }
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt-shell { box-shadow: none; border-radius: 0; max-width: none; border: 0; }
      .print-actions { display: none; }
    }
  </style>
</head>
<body>
  <article class="receipt-shell">
    <header class="header">
      <div class="header-grid">
        <div>
          <p class="kicker">Premium receipt</p>
          <h1>${escapeHtml(tenantName)}</h1>
          <p class="value">Thank you for your order.</p>
        </div>
        <div class="receipt-pill">${escapeHtml(receiptRef)}</div>
      </div>
    </header>

    <main class="content">
      <section class="details">
        <div class="card"><p class="label">Order date</p><p class="value">${escapeHtml(asDate(order?.created_at))}</p></div>
        <div class="card"><p class="label">Payment</p><p class="value">${escapeHtml(order?.payment_method_label || order?.payment_provider || "Order payment")}${order?.payment_reference ? `<br/><span>${escapeHtml(order.payment_reference)}</span>` : ""}</p></div>
        <div class="card"><p class="label">Customer</p><p class="value">${escapeHtml(order?.customer_name)}<br/><span>${escapeHtml(order?.customer_phone)}</span></p></div>
        <div class="card"><p class="label">Fulfilment</p><p class="value">${escapeHtml(order?.order_type || "Order")}${order?.customer_address ? `<br/><span>${escapeHtml(order.customer_address)}</span>` : ""}</p></div>
      </section>

      <table aria-label="Receipt items">
        <thead><tr><th>Item</th><th class="amount">Total</th></tr></thead>
        <tbody>${itemRows || `<tr><td colspan="2">No item details were available for this receipt.</td></tr>`}</tbody>
      </table>

      <section class="totals" aria-label="Receipt totals">
        ${discountRows}
        <div class="totals-row grand"><span>Total paid</span><strong>${asMoney(total, currencyCode)}</strong></div>
      </section>

      <section class="footer">
        <strong>Receipt note:</strong> This receipt was generated from the customer account area. Please keep it for your records. If anything looks wrong, contact the store and quote receipt ${escapeHtml(receiptRef)}.
      </section>
    </main>
  </article>

  <div class="print-actions">
    <button type="button" onclick="window.print()">Print / save as PDF</button>
    <button type="button" class="secondary" onclick="history.length > 1 ? history.back() : window.close()">Back</button>
  </div>
</body>
</html>`;
}

export async function GET(req: Request, context: ReceiptParams) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { orderId } = await context.params;
  const cleanOrderId = String(orderId || "").trim();
  if (!cleanOrderId) {
    return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
  }

  const { data: order, error } = await db
    .from("orders")
    .select(
      `
      id,
      tenant_id,
      customer_account_id,
      customer_name,
      customer_phone,
      customer_address,
      order_type,
      status,
      total,
      subtotal_total,
      notes,
      created_at,
      payment_provider,
      payment_method_label,
      payment_status,
      payment_reference,
      paid_at,
      reward_tier,
      reward_discount_percent,
      reward_discount_amount,
      discount_code,
      discount_name,
      discount_amount,
      customer_receipt_number,
      customer_receipt_download_count,
      order_items (
        product_name,
        unit_price,
        quantity,
        line_total
      )
    `
    )
    .eq("id", cleanOrderId)
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load receipt." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  const receiptRef = receiptNumber(order);
  if (!order.customer_receipt_number) {
    await db
      .from("orders")
      .update({ customer_receipt_number: receiptRef })
      .eq("id", cleanOrderId)
      .eq("tenant_id", session.tenant.id)
      .eq("customer_account_id", session.user.id);
  }

  await db
    .from("orders")
    .update({
      customer_receipt_last_downloaded_at: new Date().toISOString(),
      customer_receipt_download_count: Number(order.customer_receipt_download_count || 0) + 1,
    })
    .eq("id", cleanOrderId)
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id);

  const { data: receiptSettings } = await db
    .from("tenant_settings")
    .select("currency_code")
    .eq("tenant_id", session.tenant.id)
    .maybeSingle();

  const html = buildReceiptHtml({
    tenantName: session.tenant.name || "Store",
    currencyCode: String((receiptSettings as any)?.currency_code || "KES").toUpperCase(),
    order,
  });

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${receiptRef}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
