import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export type PasswordResetScope = "customer" | "tenant_admin";

const RESET_TTL_MINUTES = 45;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEmailFromAddress() {
  return process.env.ORDUVA_EMAIL_FROM || "Orduva <updates@orduva.com>";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizePasswordResetEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function passwordResetExpiresAt() {
  return new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function storePasswordResetToken(input: {
  tenantId: string;
  scope: PasswordResetScope;
  accountId: string;
  email: string;
  token: string;
  requestIp?: string | null;
  userAgent?: string | null;
}) {
  const now = new Date().toISOString();

  await db
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("tenant_id", input.tenantId)
    .eq("account_type", input.scope)
    .eq("account_id", input.accountId)
    .is("used_at", null);

  const { error } = await db.from("password_reset_tokens").insert({
    tenant_id: input.tenantId,
    account_type: input.scope,
    account_id: input.accountId,
    email: input.email,
    token_hash: hashToken(input.token),
    expires_at: passwordResetExpiresAt(),
    request_ip: input.requestIp || null,
    user_agent: input.userAgent || null,
  });

  if (error) throw new Error(error.message);
}

export async function findUsablePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const { data, error } = await db
    .from("password_reset_tokens")
    .select("id, tenant_id, account_type, account_id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(String(data.expires_at)).getTime() < Date.now()) return null;
  return data as {
    id: string;
    tenant_id: string;
    account_type: PasswordResetScope;
    account_id: string;
    email: string;
    expires_at: string;
    used_at: string | null;
  };
}

export async function markPasswordResetTokenUsed(id: string) {
  const { error } = await db.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function sendPasswordResetEmail(input: {
  to: string;
  storeName: string;
  resetUrl: string;
  scope: PasswordResetScope;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY is not configured" };
  }

  const audience = input.scope === "tenant_admin" ? "Tenant Admin" : "customer account";
  const safeStore = escapeHtml(input.storeName);
  const safeResetUrl = escapeHtml(input.resetUrl);
  const subject = `Reset your ${input.storeName} ${audience} password`;
  const text = [
    `Hello,`,
    "",
    `We received a request to reset the password for your ${audience} at ${input.storeName}.`,
    "",
    `Use this secure link to choose a new password. It expires in ${RESET_TTL_MINUTES} minutes:`,
    input.resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    "Orduva",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:28px;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde5ef;border-radius:22px;padding:28px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#336699;font-weight:700;">Orduva password reset</p>
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#111827;">Reset your password</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b5563;">We received a request to reset the password for your ${escapeHtml(audience)} at <strong>${safeStore}</strong>.</p>
        <a href="${safeResetUrl}" style="display:inline-block;background:#336699;color:#ffffff;text-decoration:none;border-radius:14px;padding:13px 18px;font-weight:700;">Choose a new password</a>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">This secure link expires in ${RESET_TTL_MINUTES} minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: getEmailFromAddress(), to: [input.to], subject, text, html }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return { ok: false, skipped: false, error: responseText || `Email provider returned ${response.status}` };
  }
  return { ok: true, skipped: false, providerResponse: responseText };
}
