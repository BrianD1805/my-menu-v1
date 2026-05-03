import { db } from "@/lib/db";

type OnboardingEmailInput = {
  tenantId: string;
  storeName: string;
  storeSlug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  contactEmail?: string | null;
  countryCode?: string | null;
};

type EmailLogStatus = "sent" | "skipped" | "failed";

type EmailLogInput = {
  tenantId: string;
  audience: "admin" | "customer";
  eventType: string;
  title: string;
  body: string;
  status: EmailLogStatus;
  metadata?: Record<string, unknown>;
};

function getEmailFromAddress() {
  return process.env.ORDUVA_EMAIL_FROM || "Orduva <hello@orduva.com>";
}

function getOwnerNotificationAddress() {
  return process.env.ORDUVA_OWNER_EMAIL || process.env.ORDUVA_EMAIL_TO || null;
}

function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getEmailFromAddress());
}

function adminLoginUrl(slug: string) {
  return `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`;
}

function storefrontUrl(slug: string) {
  return `https://${slug}.orduva.com`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function logEmailEvent(input: EmailLogInput) {
  const now = new Date().toISOString();
  const { error } = await db.from("notification_events").insert({
    tenant_id: input.tenantId,
    order_id: null,
    audience: input.audience,
    channel: "email",
    event_type: input.eventType,
    title: input.title,
    body: input.body,
    status: input.status,
    metadata: input.metadata || {},
    processed_at: input.status === "sent" || input.status === "skipped" ? now : null,
    failed_at: input.status === "failed" ? now : null,
    error_message:
      input.status === "failed" && typeof input.metadata?.error === "string"
        ? String(input.metadata.error)
        : null,
  });

  if (error) {
    console.error("[Orduva onboarding email] Failed to log email event", {
      message: error.message,
      eventType: input.eventType,
      status: input.status,
    });
  }
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return { ok: false, skipped: false, error: responseText || `Email provider returned ${response.status}` };
  }

  return { ok: true, skipped: false, providerResponse: responseText };
}

function buildClientEmail(input: OnboardingEmailInput) {
  const name = input.ownerName || input.storeName;
  const storeUrl = storefrontUrl(input.storeSlug);
  const adminUrl = adminLoginUrl(input.storeSlug);
  const safeStore = escapeHtml(input.storeName);
  const safeName = escapeHtml(name);
  const safeStoreUrl = escapeHtml(storeUrl);
  const safeAdminUrl = escapeHtml(adminUrl);

  const subject = `Your Orduva store is ready: ${input.storeName}`;
  const text = [
    `Hello ${name},`,
    "",
    `Your Orduva store foundation for ${input.storeName} has been created.`,
    "",
    `Store address: ${storeUrl}`,
    `Admin login: ${adminUrl}`,
    "",
    "Next steps:",
    "1. Open your store address and check the starter store loads.",
    "2. Sign in to admin using the owner email and password you created.",
    "3. Add your categories, products, prices and product photos.",
    "4. Upload your logo, check colours and confirm currency formatting.",
    "5. Place one test order before sharing your store address with customers.",
    "",
    "No payment has been taken at this stage.",
    "",
    "Orduva",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1F2328;max-width:640px;margin:0 auto;padding:24px;">
      <div style="border:1px solid #eee;border-radius:24px;padding:24px;background:#FFF7F0;">
        <p style="margin:0 0 8px;color:#FF6A3D;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">Your Orduva store is ready</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#0E0E10;">${safeStore}</h1>
        <p>Hello ${safeName},</p>
        <p>Your Orduva store foundation has been created. Keep these links handy while you finish setup.</p>
        <p><strong>Store address:</strong><br><a href="${safeStoreUrl}">${safeStoreUrl}</a></p>
        <p><strong>Admin login:</strong><br><a href="${safeAdminUrl}">${safeAdminUrl}</a></p>
        <div style="margin:20px 0;display:block;">
          <a href="${safeStoreUrl}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 16px;border-radius:14px;background:#FF6A3D;color:#fff;text-decoration:none;font-weight:800;">View your store</a>
          <a href="${safeAdminUrl}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 16px;border-radius:14px;background:#0E0E10;color:#fff;text-decoration:none;font-weight:800;">Sign in to admin</a>
        </div>
        <h2 style="font-size:18px;margin:18px 0 8px;">What to do next</h2>
        <ol style="padding-left:22px;">
          <li>Open your store address and check the starter store loads.</li>
          <li>Sign in to admin using the owner email and password you created.</li>
          <li>Add categories, products, prices and product photos.</li>
          <li>Upload your logo, check colours and confirm currency formatting.</li>
          <li>Place one test order before sharing your store address with customers.</li>
        </ol>
        <p style="font-size:13px;color:#68707A;">No payment has been taken at this stage.</p>
      </div>
    </div>`;

  return { subject, text, html };
}

function buildOwnerEmail(input: OnboardingEmailInput) {
  const storeUrl = storefrontUrl(input.storeSlug);
  const adminUrl = adminLoginUrl(input.storeSlug);
  const ownerEmail = input.ownerEmail || "not supplied";
  const subject = `New Orduva store onboarded: ${input.storeName}`;
  const text = [
    `A new Orduva store has been created: ${input.storeName}`,
    "",
    `Store address: ${storeUrl}`,
    `Admin login: ${adminUrl}`,
    `Owner: ${input.ownerName || "not supplied"}`,
    `Owner email: ${ownerEmail}`,
    `Country: ${input.countryCode || "not supplied"}`,
    "",
    "Owner follow-up checks:",
    "- Confirm storefront opens",
    "- Confirm admin login works",
    "- Review logo, colours, currency and first product setup",
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#1F2328;max-width:640px;margin:0 auto;padding:24px;"><h1>New Orduva store onboarded</h1><p><strong>${escapeHtml(input.storeName)}</strong></p><p><strong>Store address:</strong><br><a href="${escapeHtml(storeUrl)}">${escapeHtml(storeUrl)}</a></p><p><strong>Admin login:</strong><br><a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></p><p><strong>Owner:</strong> ${escapeHtml(input.ownerName || "not supplied")}<br><strong>Owner email:</strong> ${escapeHtml(ownerEmail)}<br><strong>Country:</strong> ${escapeHtml(input.countryCode || "not supplied")}</p></div>`;

  return { subject, text, html };
}

export async function sendOnboardingLaunchNotifications(input: OnboardingEmailInput) {
  const clientRecipient = input.ownerEmail || input.contactEmail || null;
  const ownerRecipient = getOwnerNotificationAddress();
  const configured = emailConfigured();

  const result = {
    configured,
    client: clientRecipient ? "pending" : "skipped_no_recipient",
    owner: ownerRecipient ? "pending" : "skipped_no_owner_recipient",
  } as Record<string, unknown>;

  if (!configured) {
    await logEmailEvent({
      tenantId: input.tenantId,
      audience: "customer",
      eventType: "client_onboarding_email_skipped",
      title: "Client onboarding email not sent",
      body: `Email provider is not configured for ${input.storeName}.`,
      status: "skipped",
      metadata: { reason: "email_not_configured", intendedRecipient: clientRecipient, storeSlug: input.storeSlug },
    });
    result.client = clientRecipient ? "skipped_email_not_configured" : result.client;
    result.owner = ownerRecipient ? "skipped_email_not_configured" : result.owner;
    return result;
  }

  if (clientRecipient) {
    const email = buildClientEmail(input);
    try {
      const sendResult = await sendViaResend({ to: clientRecipient, ...email });
      if (sendResult.ok) {
        result.client = "sent";
        await logEmailEvent({ tenantId: input.tenantId, audience: "customer", eventType: "client_onboarding_email_sent", title: email.subject, body: email.text, status: "sent", metadata: { provider: "resend", recipient: clientRecipient, storeSlug: input.storeSlug, providerResponse: sendResult.providerResponse } });
      } else {
        result.client = sendResult.skipped ? "skipped_email_not_configured" : "failed";
        await logEmailEvent({ tenantId: input.tenantId, audience: "customer", eventType: "client_onboarding_email_failed", title: email.subject, body: email.text, status: sendResult.skipped ? "skipped" : "failed", metadata: { provider: "resend", recipient: clientRecipient, storeSlug: input.storeSlug, error: sendResult.error } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      result.client = "failed";
      await logEmailEvent({ tenantId: input.tenantId, audience: "customer", eventType: "client_onboarding_email_failed", title: email.subject, body: email.text, status: "failed", metadata: { provider: "resend", recipient: clientRecipient, storeSlug: input.storeSlug, error: message } });
    }
  }

  if (ownerRecipient) {
    const email = buildOwnerEmail(input);
    try {
      const sendResult = await sendViaResend({ to: ownerRecipient, ...email });
      if (sendResult.ok) {
        result.owner = "sent";
        await logEmailEvent({ tenantId: input.tenantId, audience: "admin", eventType: "owner_new_store_email_sent", title: email.subject, body: email.text, status: "sent", metadata: { provider: "resend", recipient: ownerRecipient, storeSlug: input.storeSlug, providerResponse: sendResult.providerResponse } });
      } else {
        result.owner = sendResult.skipped ? "skipped_email_not_configured" : "failed";
        await logEmailEvent({ tenantId: input.tenantId, audience: "admin", eventType: "owner_new_store_email_failed", title: email.subject, body: email.text, status: sendResult.skipped ? "skipped" : "failed", metadata: { provider: "resend", recipient: ownerRecipient, storeSlug: input.storeSlug, error: sendResult.error } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      result.owner = "failed";
      await logEmailEvent({ tenantId: input.tenantId, audience: "admin", eventType: "owner_new_store_email_failed", title: email.subject, body: email.text, status: "failed", metadata: { provider: "resend", recipient: ownerRecipient, storeSlug: input.storeSlug, error: message } });
    }
  }

  return result;
}
