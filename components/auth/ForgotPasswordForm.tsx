"use client";

import { FormEvent, useState } from "react";

type Scope = "customer" | "tenant_admin";

function normalizeStoreAddress(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.orduva\.com\/?$/, "")
    .replace(/\/.*$/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ForgotPasswordForm({ scope, tenantName }: { scope: Scope; tenantName?: string }) {
  const [email, setEmail] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ scope, email, tenantSlug: scope === "tenant_admin" ? normalizeStoreAddress(tenantSlug) : undefined }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not request password reset.");
      setMessage(payload.message || "If that email exists, a password reset link has been sent.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not request password reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password help</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {scope === "tenant_admin"
            ? "Enter your store address and owner email. We will send a secure reset link using the existing Orduva updates email service."
            : `Enter the email used for your ${tenantName || "store"} customer account. We will send a secure reset link if the account exists.`}
        </p>
      </div>

      {scope === "tenant_admin" ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Store address</label>
          <input
            value={tenantSlug}
            onChange={(event) => setTenantSlug(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#336699]"
            placeholder="zimzaexpress or zimzaexpress.orduva.com"
            required
          />
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#336699]"
          placeholder="you@example.com"
          required
        />
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-[#336699] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28547f] disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-sm text-slate-600">
        Remembered your password?{" "}
        <a href={scope === "tenant_admin" ? "/admin/login" : "/account/login"} className="font-semibold text-slate-900 underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
