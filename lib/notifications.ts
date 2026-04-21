import { db } from "@/lib/db";

export type NotificationAudience = "admin" | "customer";
export type NotificationChannel = "push" | "in_app";

export type NotificationEventInput = {
  tenantId: string;
  orderId?: string | null;
  audience: NotificationAudience;
  channel?: NotificationChannel;
  eventType: string;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
};

export async function enqueueNotificationEvent(input: NotificationEventInput) {
  try {
    await db.from("notification_events").insert({
      tenant_id: input.tenantId,
      order_id: input.orderId || null,
      audience: input.audience,
      channel: input.channel || "push",
      event_type: input.eventType,
      title: input.title,
      body: input.body,
      payload: input.payload || null,
      status: "pending",
    });
  } catch {
    // Foundation-only for now. Notifications should never block orders or status updates.
  }
}

export function customerEventFromStatus(status: string) {
  switch (status) {
    case "accepted":
      return {
        eventType: "order_accepted",
        title: "Order accepted",
        body: "Your order has been accepted and will be prepared shortly.",
      };
    case "preparing":
      return {
        eventType: "order_preparing",
        title: "Order in preparation",
        body: "Your order is being prepared now.",
      };
    case "ready":
      return {
        eventType: "order_ready",
        title: "Order ready",
        body: "Your order is ready.",
      };
    case "completed":
      return {
        eventType: "order_completed",
        title: "Order completed",
        body: "Your order has been completed. Thank you for ordering with us.",
      };
    case "cancelled":
      return {
        eventType: "order_cancelled",
        title: "Order cancelled",
        body: "Your order has been cancelled. Please contact the business if you need help.",
      };
    default:
      return null;
  }
}
