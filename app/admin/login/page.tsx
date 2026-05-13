"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

function normalizeSlugFromHost() {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "admin.localhost" || hostname.startsWith("admin.")) {
    return "";
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) return parts[0];
  return parts[0] === "www" && parts[1] ? parts[1] : parts[0] || "";
}

function normalizeStoreAddress(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type MessageTone = "info" | "error" | "success";
type SessionState =
  | { loading: true; authenticated: false }
  | { loading: false; authenticated: false }
  | {
      loading: false;
      authenticated: true;
      user: { email: string | null; full_name: string | null };
      tenant: { slug: string; name: string };
    };

export default function AdminLoginPage() {
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [busy, setBusy] = useState<"login" | "logout" | null>(null);
  const [session, setSession] = useState<SessionState>({ loading: true, authenticated: false });
  const tenantHint = useMemo(() => normalizeSlugFromHost(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const selectedStore = new URLSearchParams(window.location.search).get("tenant");
    if (selectedStore) {
      const normalizedStore = normalizeStoreAddress(selectedStore);
      if (tenantSlug !== normalizedStore) setTenantSlug(normalizedStore);
      return;
    }
    if (!tenantSlug && tenantHint) setTenantSlug(tenantHint);
  }, [tenantHint, tenantSlug]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/admin/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setSession({ loading: false, authenticated: false });
          return;
        }

        const payload = await response.json();
        if (!cancelled && payload?.authenticated) {
          setSession({
            loading: false,
            authenticated: true,
            user: payload.user,
            tenant: payload.tenant,
          });
        } else if (!cancelled) {
          setSession({ loading: false, authenticated: false });
        }
      } catch {
        if (!cancelled) setSession({ loading: false, authenticated: false });
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy("login");
    setMessageTone("info");
    setMessage("Signing you in...");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: tenantSlug || undefined, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed");
      setMessageTone("success");
      setMessage(`Login successful. Opening ${payload?.tenant?.name || "your admin area"}...`);
      window.location.href = "/admin";
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    setBusy("logout");
    setMessageTone("info");
    setMessage("Signing out...");
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } finally {
      setBusy(null);
    }
  }

  const messageClasses =
    messageTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : messageTone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-[#DCE5E1] bg-[#EAFBF5] text-[#111827]";

  return (
    <main className="orduva-admin-refresh min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(15,118,110,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.05),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(15,118,110,0.06),transparent_36%),linear-gradient(135deg,#F6F8F7_0%,#F1F5F4_48%,#FFFFFF_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        {session.loading ? (
          <section className="w-full rounded-[28px] border border-[#DCE5E1] bg-white p-6 text-center sm:p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#0F766E] text-lg font-black text-white">
              O
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Orduva Admin</p>
            <h1 className="mt-3 text-2xl font-bold text-[#111827]">We&apos;re getting things ready</h1>
            <p className="mt-3 text-sm leading-6 text-[#374151]">Checking whether you are already signed in.</p>
          </section>
        ) : session.authenticated ? (
          <section className="w-full rounded-[28px] border border-[#DCE5E1] bg-[#EAFBF5] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Orduva Admin</p>
            <h1 className="mt-3 text-2xl font-bold text-[#111827]">Already Signed in</h1>
            <p className="mt-3 text-sm leading-6 text-[#374151]">
              Signed in as {session.user.full_name || session.user.email} for {session.tenant.name}.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="/admin"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#115E59]"
              >
                Open admin
              </a>
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy === "logout"}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#111827] ring-1 ring-[#DCE5E1] transition hover:bg-[#EAFBF5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "logout" ? "Signing out..." : "Sign out"}
              </button>
            </div>
            {message ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${messageClasses}`}>{message}</div> : null}
          </section>
        ) : (
          <section className="w-full rounded-[28px] border border-[#DCE5E1] bg-white p-6 sm:p-8">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Orduva Admin</p>
              <h1 className="mt-3 text-2xl font-bold text-[#111827]">Sign in</h1>
              <p className="mt-2 text-sm leading-6 text-[#374151]">Use your store owner email address and password.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#111827]">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#DCE5E1] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#0F766E] focus:"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#111827]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#DCE5E1] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#0F766E] focus:"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "login"}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "login" ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {message ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${messageClasses}`}>{message}</div> : null}
          </section>
        )}
      </div>
    </main>
  );
}
