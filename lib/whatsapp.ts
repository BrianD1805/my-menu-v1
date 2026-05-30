import { formatMoney, type MoneyFormatSettings } from "@/lib/money";

type OrderForWhatsapp = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  order_type: string;
  total: number;
  notes: string | null;
};

type PaymentForWhatsapp = {
  label?: string | null;
  status?: string | null;
  reference?: string | null;
};

type OrderItemForWhatsapp = {
  product_name: string;
  quantity: number;
  line_total: number;
};

export function buildWhatsAppOrderMessage(args: {
  tenantName: string;
  order: OrderForWhatsapp;
  items: OrderItemForWhatsapp[];
  payment?: PaymentForWhatsapp | null;
} & MoneyFormatSettings) {
  const { tenantName, order, items, payment, ...moneySettings } = args;
  const lines: string[] = [];
  lines.push(`New order for ${tenantName}`);
  lines.push("");
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Customer: ${order.customer_name}`);
  lines.push(`Phone: ${order.customer_phone}`);
  lines.push(`Type: ${order.order_type}`);
  if (order.customer_address) lines.push(`Address: ${order.customer_address}`);
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  lines.push("");
  lines.push("Items:");
  for (const item of items) {
    lines.push(`- ${item.quantity} x ${item.product_name} = ${formatMoney(Number(item.line_total), moneySettings)}`);
  }
  lines.push("");
  lines.push(`Total: ${formatMoney(Number(order.total), moneySettings)}`);
  const paymentStatus = String(payment?.status || "").toLowerCase();
  const paymentLabel = payment?.label?.trim();
  const paymentReference = payment?.reference?.trim();
  if (paymentStatus === "paid") {
    lines.push(`Payment: ${paymentLabel || "Paid"}`);
    if (paymentReference) lines.push(`Payment reference: ${paymentReference}`);
  } else if (paymentLabel) {
    lines.push(`Payment: ${paymentLabel}`);
  } else {
    lines.push("Payment: Pay on fulfilment");
  }
  lines.push("");
  lines.push("Please confirm this order.");
  return lines.join("\n");
}

export function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const cleanedPhone = cleanPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

export function buildWhatsAppAppUrl(phone: string, message: string) {
  const cleanedPhone = cleanPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`;
}
