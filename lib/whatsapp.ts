type OrderForWhatsapp = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  order_type: string;
  total: number;
  notes: string | null;
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
}) {
  const { tenantName, order, items } = args;

  const lines: string[] = [];

  lines.push(`New order for ${tenantName}`);
  lines.push("");
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Customer: ${order.customer_name}`);
  lines.push(`Phone: ${order.customer_phone}`);
  lines.push(`Type: ${order.order_type}`);

  if (order.customer_address) {
    lines.push(`Address: ${order.customer_address}`);
  }

  if (order.notes) {
    lines.push(`Notes: ${order.notes}`);
  }

  lines.push("");
  lines.push("Items:");

  for (const item of items) {
    lines.push(`- ${item.quantity} x ${item.product_name} = £${Number(item.line_total).toFixed(2)}`);
  }

  lines.push("");
  lines.push(`Total: £${Number(order.total).toFixed(2)}`);
  lines.push("Payment: Offline");
  lines.push("");
  lines.push("Please confirm this order.");

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const cleanedPhone = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}
