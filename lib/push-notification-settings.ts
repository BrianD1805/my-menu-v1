import { db } from "@/lib/db";

export type PushAudience = "admin" | "customer";

export type PushTemplate = {
  audience: PushAudience;
  eventType: string;
  label: string;
  description: string;
  titleTemplate: string;
  bodyTemplate: string;
  enabled: boolean;
  locked?: boolean;
};

export type PushTemplateRow = {
  tenant_id: string;
  audience: PushAudience;
  event_type: string;
  title_template: string | null;
  body_template: string | null;
  enabled: boolean | null;
};

export const DEFAULT_PUSH_TEMPLATES: PushTemplate[] = [
  {
    audience: "admin",
    eventType: "new_order",
    label: "Store Admin: new order alert",
    description: "Sent to saved Store Admin devices when a new order is created or a paid online order is confirmed.",
    titleTemplate: "New order received",
    bodyTemplate: "A new order has been received. Open Orders to view it.",
    enabled: true,
  },
  {
    audience: "admin",
    eventType: "admin_test",
    label: "Store Admin: test push",
    description: "Used by the test button in Store settings.",
    titleTemplate: "Orduva Admin",
    bodyTemplate: "Real push test sent to installed admin devices.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_received",
    label: "Customer: order received",
    description: "Sent when the customer order is received by the store.",
    titleTemplate: "Order received",
    bodyTemplate: "Your order has been received and is waiting for confirmation.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "payment_received",
    label: "Customer: online payment received",
    description: "Sent after an online payment is confirmed and the order is sent to the store.",
    titleTemplate: "Payment received",
    bodyTemplate: "Your payment has been received and the order has been sent to the store.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_accepted",
    label: "Customer: order accepted",
    description: "Sent when the order status is marked accepted.",
    titleTemplate: "Order accepted",
    bodyTemplate: "Your order has been accepted and will be prepared shortly.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_preparing",
    label: "Customer: preparing",
    description: "Sent when the order status is marked preparing.",
    titleTemplate: "Order in preparation",
    bodyTemplate: "Your order is being prepared now.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_ready",
    label: "Customer: ready / out for delivery",
    description: "Sent when the order status is marked ready. Untick this if you still want to mark the flow as ready/out for delivery but do not want to push the customer.",
    titleTemplate: "Order ready",
    bodyTemplate: "Your order is ready.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_completed",
    label: "Customer: completed",
    description: "Sent when the order is marked completed.",
    titleTemplate: "Order completed",
    bodyTemplate: "Your order has been completed. Thank you for ordering with us.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "order_cancelled",
    label: "Customer: cancelled",
    description: "Sent when the order is cancelled.",
    titleTemplate: "Order cancelled",
    bodyTemplate: "Your order has been cancelled. Please contact the business if you need help.",
    enabled: true,
  },
  {
    audience: "customer",
    eventType: "preorder_balance_requested",
    label: "Customer: pre-order balance requested",
    description: "Sent when stock arrives and a balance payment is requested.",
    titleTemplate: "Balance payment ready",
    bodyTemplate: "Your pre-order balance is now ready to pay.",
    enabled: true,
  },
];

export function inferPushEventType(audience: PushAudience, payload: { tag?: string; eventType?: string }) {
  if (payload.eventType) return payload.eventType;
  const tag = String(payload.tag || "").toLowerCase();
  if (audience === "admin") return tag.includes("real-test") ? "admin_test" : "new_order";
  if (tag.includes("-paid")) return "payment_received";
  if (tag.includes("-received")) return "order_received";
  if (tag.includes("accepted")) return "order_accepted";
  if (tag.includes("preparing")) return "order_preparing";
  if (tag.includes("ready")) return "order_ready";
  if (tag.includes("completed")) return "order_completed";
  if (tag.includes("cancelled")) return "order_cancelled";
  if (tag.includes("balance")) return "preorder_balance_requested";
  return "order_received";
}

export function mergePushTemplates(rows: PushTemplateRow[] | null | undefined) {
  const byKey = new Map<string, PushTemplateRow>();
  for (const row of rows || []) byKey.set(`${row.audience}:${row.event_type}`, row);

  return DEFAULT_PUSH_TEMPLATES.map((template) => {
    const row = byKey.get(`${template.audience}:${template.eventType}`);
    return {
      ...template,
      titleTemplate: String(row?.title_template || template.titleTemplate),
      bodyTemplate: String(row?.body_template || template.bodyTemplate),
      enabled: row?.enabled !== undefined && row?.enabled !== null ? row.enabled === true : template.enabled,
    };
  });
}

export async function getTenantPushTemplates(tenantId: string) {
  const { data, error } = await db
    .from("tenant_push_notification_settings")
    .select("tenant_id,audience,event_type,title_template,body_template,enabled")
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("[Orduva push settings] Could not load push templates", error.message);
    return mergePushTemplates([]);
  }

  return mergePushTemplates((data || []) as PushTemplateRow[]);
}

function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_match, key) => {
    const value = variables[key];
    return value === undefined || value === null ? "" : String(value);
  }).replace(/\s+/g, " ").trim();
}

export async function buildPushFromSettings(input: {
  tenantId: string;
  audience: PushAudience;
  eventType: string;
  fallbackTitle: string;
  fallbackBody: string;
  variables?: Record<string, unknown>;
}) {
  const templates = await getTenantPushTemplates(input.tenantId);
  const template = templates.find((item) => item.audience === input.audience && item.eventType === input.eventType);
  const variables = {
    defaultTitle: input.fallbackTitle,
    defaultBody: input.fallbackBody,
    ...input.variables,
  };

  if (template && !template.enabled) {
    return { enabled: false, title: input.fallbackTitle, body: input.fallbackBody };
  }

  return {
    enabled: true,
    title: renderTemplate(template?.titleTemplate || input.fallbackTitle, variables) || input.fallbackTitle,
    body: renderTemplate(template?.bodyTemplate || input.fallbackBody, variables) || input.fallbackBody,
  };
}

export async function getTenantCustomerPushIcon(tenantId: string) {
  const { data } = await db
    .from("tenant_settings")
    .select("favicon_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const favicon = String((data as Record<string, unknown> | null)?.favicon_url || "").trim();
  return favicon || "/favicon.ico";
}
