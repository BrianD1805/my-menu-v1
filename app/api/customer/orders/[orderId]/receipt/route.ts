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


function pdfText(value: unknown, max = 120) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, max);
}

function wrapPdfText(value: unknown, maxChars = 64) {
  const words = String(value ?? "").replace(/[\r\n\t]+/g, " ").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function parseJpegSize(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

async function loadJpegLogo(logoUrl?: string | null) {
  const cleanUrl = String(logoUrl || "").trim();
  if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) return null;
  try {
    const response = await fetch(cleanUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    const buffer = Buffer.from(await response.arrayBuffer());
    const size = parseJpegSize(buffer);
    if (!size || (!contentType.includes("jpeg") && buffer[0] !== 0xff)) return null;
    return { buffer, ...size };
  } catch {
    return null;
  }
}

function buildPremiumReceiptPdf({ tenantName, currencyCode, logo, order }: { tenantName: string; currencyCode: string; logo?: { buffer: Buffer; width: number; height: number } | null; order: any }) {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const receiptRef = receiptNumber(order);
  const subtotal = Number(order?.subtotal_total ?? order?.total ?? 0);
  const rewardDiscount = Number(order?.reward_discount_amount || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const total = Number(order?.total || 0);
  const hasAdjustments = rewardDiscount > 0 || discountAmount > 0 || subtotal !== total;
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  let y = 800;
  const stream: string[] = [];

  function setFill(hex: string) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }
  function setStroke(hex: string) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }
  function rect(x: number, yy: number, w: number, h: number, fill?: string, stroke?: string, strokeWidth = 1) {
    if (fill) setFill(fill);
    if (stroke) setStroke(stroke);
    stream.push(`${strokeWidth} w`);
    stream.push(`${x} ${yy} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }
  function line(x1: number, y1: number, x2: number, y2: number, colour = "#e2e8f0", width = 1) {
    setStroke(colour);
    stream.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }
  function text(value: unknown, x: number, yy: number, size = 10, colour = "#0f172a", font = "F1") {
    setFill(colour);
    stream.push("BT", `/${font} ${size} Tf`, `${x} ${yy} Td`, `(${pdfText(value, 180)}) Tj`, "ET");
  }
  function money(value: unknown) {
    return asMoney(value, currencyCode);
  }

  // Page background and premium receipt shell.
  rect(0, 0, pageWidth, pageHeight, "#f8f4f0");
  rect(margin, 44, pageWidth - margin * 2, pageHeight - 88, "#ffffff", "#e2e8f0", 1);
  rect(margin, pageHeight - 50, pageWidth - margin * 2, 6, "#059669");
  rect(margin + 155, pageHeight - 50, pageWidth - margin * 2 - 310, 6, "#334155");

  // Header.
  rect(margin, 714, pageWidth - margin * 2, 84, "#f8fafc", "#e2e8f0", 1);
  if (logo) {
    const box = 50;
    const ratio = Math.min(box / logo.width, box / logo.height);
    const w = Math.max(1, Math.round(logo.width * ratio));
    const h = Math.max(1, Math.round(logo.height * ratio));
    const x = margin + 20 + (box - w) / 2;
    const yy = 732 + (box - h) / 2;
    rect(margin + 20, 732, box, box, "#ffffff", "#e2e8f0", 1);
    stream.push(`q ${w} 0 0 ${h} ${x.toFixed(2)} ${yy.toFixed(2)} cm /ImLogo Do Q`);
  } else {
    rect(margin + 20, 732, 50, 50, "#ecfdf5", "#bbf7d0", 1);
    text(String(tenantName || "S").slice(0, 1).toUpperCase(), margin + 39, 751, 22, "#047857", "F2");
  }
  text("RECEIPT", margin + 86, 770, 9, "#047857", "F2");
  text(tenantName, margin + 86, 744, 24, "#0f172a", "F2");
  text("Thank you for your order.", margin + 86, 728, 10, "#64748b");
  rect(pageWidth - margin - 132, 748, 112, 24, "#f0fdf4", "#bbf7d0", 1);
  text(receiptRef, pageWidth - margin - 122, 756, 10, "#065f46", "F2");

  // Detail cards.
  const cardY = 626;
  const cardW = (pageWidth - margin * 2 - 16) / 2;
  const cards = [
    ["ORDER DATE", asDate(order?.created_at)],
    ["PAYMENT", `${order?.payment_method_label || order?.payment_provider || "Order payment"}${order?.payment_reference ? ` · ${order.payment_reference}` : ""}`],
    ["CUSTOMER", `${order?.customer_name || "Customer"}${order?.customer_phone ? ` · ${order.customer_phone}` : ""}`],
    ["FULFILMENT", `${order?.order_type || "Order"}${order?.customer_address ? ` · ${order.customer_address}` : ""}`],
  ];
  cards.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + 20 + col * (cardW + 16);
    const yy = cardY - row * 64;
    rect(x, yy, cardW, 50, "#f8fafc", "#e2e8f0", 1);
    text(label, x + 12, yy + 32, 7.5, "#64748b", "F2");
    wrapPdfText(value, 44).slice(0, 2).forEach((lineText, lineIndex) => {
      text(lineText, x + 12, yy + 17 - lineIndex * 11, 9.5, "#0f172a", lineIndex === 0 ? "F2" : "F1");
    });
  });

  // Items table.
  y = 475;
  rect(margin + 20, y, pageWidth - margin * 2 - 40, 30, "#f1f5f9", "#e2e8f0", 1);
  text("ITEM", margin + 34, y + 11, 8.5, "#334155", "F2");
  text("TOTAL", pageWidth - margin - 96, y + 11, 8.5, "#334155", "F2");
  y -= 2;

  const maxRows = 11;
  items.slice(0, maxRows).forEach((item: any) => {
    const rowH = 42;
    y -= rowH;
    rect(margin + 20, y, pageWidth - margin * 2 - 40, rowH, "#ffffff", "#e2e8f0", 1);
    const itemName = item?.product_name || "Item";
    wrapPdfText(itemName, 54).slice(0, 2).forEach((lineText, lineIndex) => {
      text(lineText, margin + 34, y + 24 - lineIndex * 11, 9.2, "#0f172a", lineIndex === 0 ? "F2" : "F1");
    });
    text(`${Number(item?.quantity || 0)} x ${money(item?.unit_price)}`, margin + 34, y + 8, 8.5, "#64748b");
    text(money(item?.line_total), pageWidth - margin - 116, y + 18, 9.5, "#0f172a", "F2");
  });
  if (items.length > maxRows) {
    y -= 18;
    text(`+ ${items.length - maxRows} more item(s) shown on the online receipt`, margin + 34, y, 8.5, "#64748b");
  }

  // Totals.
  const totalsW = 230;
  const totalsX = pageWidth - margin - 20 - totalsW;
  let totalsY = Math.max(140, y - 108);
  rect(totalsX, totalsY, totalsW, hasAdjustments ? 108 : 62, "#ffffff", "#e2e8f0", 1);
  let ty = totalsY + (hasAdjustments ? 84 : 38);
  if (hasAdjustments) {
    text("Subtotal", totalsX + 14, ty, 9.5, "#334155");
    text(money(subtotal), totalsX + 132, ty, 9.5, "#0f172a", "F2");
    ty -= 22;
    if (rewardDiscount > 0) {
      text(`Rewards discount${order?.reward_tier ? ` · ${order.reward_tier}` : ""}`, totalsX + 14, ty, 9.2, "#047857");
      text(`-${money(rewardDiscount)}`, totalsX + 132, ty, 9.2, "#047857", "F2");
      ty -= 20;
    }
    if (discountAmount > 0) {
      text(order?.discount_name || order?.discount_code || "Discount", totalsX + 14, ty, 9.2, "#047857");
      text(`-${money(discountAmount)}`, totalsX + 132, ty, 9.2, "#047857", "F2");
      ty -= 20;
    }
    line(totalsX + 14, ty + 9, totalsX + totalsW - 14, ty + 9);
  }
  text("Total paid", totalsX + 14, totalsY + 15, 12, "#0f172a", "F2");
  text(money(total), totalsX + 118, totalsY + 15, 12, "#0f172a", "F2");

  // Footer note.
  rect(margin + 20, 72, pageWidth - margin * 2 - 40, 46, "#f8fafc", "#e2e8f0", 1);
  text("Receipt note", margin + 34, 96, 8, "#047857", "F2");
  wrapPdfText(`Generated by ${tenantName}. Please quote receipt ${receiptRef} if you contact the store.`, 88).slice(0, 2).forEach((lineText, index) => {
    text(lineText, margin + 34, 82 - index * 11, 8.5, "#64748b");
  });

  const content = stream.join("\n");
  const resources = logo ? "/Font << /F1 4 0 R /F2 5 0 R >> /XObject << /ImLogo 6 0 R >>" : "/Font << /F1 4 0 R /F2 5 0 R >>";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << ${resources} >> /Contents ${logo ? 7 : 6} 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  if (logo) {
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.buffer.length} >>\nstream\n${logo.buffer.toString("binary")}\nendstream`);
  }
  objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

function shortOrderRef(id: string) {
  return `ORD-${String(id || "").slice(0, 8).toUpperCase()}`;
}

function receiptNumber(row: any) {
  return String(row?.customer_receipt_number || shortOrderRef(row?.id || ""));
}

function buildReceiptHtml({ tenantName, currencyCode, logoUrl, order }: { tenantName: string; currencyCode: string; logoUrl?: string | null; order: any }) {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const receiptRef = receiptNumber(order);
  const subtotal = Number(order?.subtotal_total ?? order?.total ?? 0);
  const rewardDiscount = Number(order?.reward_discount_amount || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const total = Number(order?.total || 0);
  const hasAdjustments = rewardDiscount > 0 || discountAmount > 0 || subtotal !== total;
  const safeLogoUrl = String(logoUrl || "").trim();

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
    .brand-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-wrap {
      width: 64px;
      height: 64px;
      border-radius: 22px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex: 0 0 auto;
      box-shadow: 0 12px 30px rgba(15,23,42,.08);
    }
    .logo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
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
    .print-actions button.share { background: #047857; }
    @media (max-width: 640px) {
      body { padding: 18px 12px; }
      .header, .content { padding-left: 20px; padding-right: 20px; }
      .header-grid, .details { grid-template-columns: 1fr; }
      .brand-row { align-items: flex-start; }
      .logo-wrap { width: 54px; height: 54px; border-radius: 18px; }
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
        <div class="brand-row">
          ${safeLogoUrl ? `<div class="logo-wrap"><img src="${escapeHtml(safeLogoUrl)}" alt="${escapeHtml(tenantName)} logo" /></div>` : ""}
          <div>
            <p class="kicker">Receipt</p>
            <h1>${escapeHtml(tenantName)}</h1>
            <p class="value">Thank you for your order.</p>
          </div>
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

  <script>
    async function shareReceipt() {
      const title = document.title || "Receipt";
      const text = "Receipt from ${escapeHtml(tenantName)}";
      try {
        const pdfUrl = new URL(window.location.href);
        pdfUrl.searchParams.set("format", "pdf");
        const response = await fetch(pdfUrl.toString(), { cache: "no-store" });
        const pdfBlob = await response.blob();
        const file = new File([pdfBlob], "${escapeHtml(receiptRef)}.pdf", { type: "application/pdf" });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text, files: [file] });
          return;
        }
        const objectUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1500);
        alert("PDF receipt downloaded. Open your downloads and share the PDF file.");
      } catch (error) {
        alert("Sharing is not available here. Use Print / save as PDF, then share the saved PDF file.");
      }
    }
  </script>

  <div class="print-actions">
    <button type="button" onclick="window.print()">Print / save as PDF</button>
    <button type="button" class="share" onclick="shareReceipt()">Share</button>
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
    .select("currency_code, logo_url")
    .eq("tenant_id", session.tenant.id)
    .maybeSingle();

  const tenantName = session.tenant.name || "Store";
  const currencyCode = String((receiptSettings as any)?.currency_code || "KES").toUpperCase();
  const receiptRefForFile = receiptNumber(order);
  const requestUrl = new URL(req.url);

  if (requestUrl.searchParams.get("format") === "pdf") {
    const logo = await loadJpegLogo((receiptSettings as any)?.logo_url || null);
    const pdf = buildPremiumReceiptPdf({ tenantName, currencyCode, logo, order });
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receiptRefForFile}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const html = buildReceiptHtml({
    tenantName,
    currencyCode,
    logoUrl: (receiptSettings as any)?.logo_url || null,
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
