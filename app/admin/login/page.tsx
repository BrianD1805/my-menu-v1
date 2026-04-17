"use client";

import { FormEvent, useMemo, useState } from "react";

function normalizeSlugFromHost() {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) return parts[0];
  return parts[0] === "www" && parts[1] ? parts[1] : parts[0] || "orduva";
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"login" | "setup" | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const tenantHint = useMemo(() => normalizeSlugFromHost(), []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy("login");
    setMessage("Signing in...");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed");
      window.location.href = "/admin/orders";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleBootstrap(event: FormEvent) {
    event.preventDefault();
    setBusy("setup");
    setMessage("Creating owner login...");
    try {
      const response = await fetch("/api/admin/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, accessKey: setupKey }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Bootstrap failed");
      setMessage("Owner login created. You are now signed in.");
      window.location.href = "/admin/orders";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bootstrap failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-[460px] rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Orduva owner login</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in to admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This login is tenant-specific. You will only see the admin for the current tenant.
          </p>
          <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Current tenant hint: <span className="font-semibold text-slate-900">{tenantHint || "current tenant"}</span>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Owner email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="owner@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy === "login"}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "login" ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => setSetupOpen((current) => !current)}
            className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
          >
            {setupOpen ? "Hide first-owner setup" : "First owner setup"}
          </button>
          {setupOpen ? (
            <form onSubmit={handleBootstrap} className="mt-4 space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Use this once per tenant to create the first owner login. You will need the bootstrap access key from your Netlify environment.
              </p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Tenant owner"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Owner email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Choose a password"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Bootstrap access key</label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={(event) => setSetupKey(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="ADMIN_ACCESS_KEY"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "setup"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "setup" ? "Creating owner..." : "Create first owner"}
              </button>
            </form>
          ) : null}
        </div>

        {message ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
      </div>
    </main>
  );
}
