"use client";

import { useState } from "react";

export default function CustomerAuthForm({
  mode,
  tenantName,
}: {
  mode: "login" | "signup";
  tenantName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const url = mode === "signup" ? "/api/customer/auth/signup" : "/api/customer/auth/login";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Could not complete customer account request.");
      setBusy(false);
      return;
    }

    setSuccess(mode === "signup" ? "Account created. Redirecting to storefront..." : "Signed in. Redirecting to storefront...");
    window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer account</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {mode === "signup" ? "Create your account" : "Sign in to your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === "signup"
            ? `Create a customer account for ${tenantName} so future orders, order history, and push notifications can be linked to you cleanly.`
            : `Sign in to your ${tenantName} customer account.`}
        </p>
      </div>

      {mode === "signup" ? (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input name="fullName" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
        </>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <div className="text-sm text-slate-600">
        {mode === "signup" ? (
          <p>Already have an account? <a href="/account/login" className="font-semibold text-slate-900 underline">Sign in</a></p>
        ) : (
          <p>Need an account? <a href="/account/signup" className="font-semibold text-slate-900 underline">Create one</a></p>
        )}
      </div>
    </form>
  );
}
