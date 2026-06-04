"use client";

import { FormEvent, useMemo, useState } from "react";

export default function ResetPasswordForm({ defaultToken, loginHref }: { defaultToken?: string; loginHref: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = useMemo(() => defaultToken || "", [defaultToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (password !== confirmPassword) throw new Error("The two passwords do not match.");
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not reset password.");
      setSuccess("Your password has been reset. You can now sign in with the new password.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password reset</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use at least 8 characters. The reset link can only be used once.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#336699]"
          required
          minLength={8}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#336699]"
          required
          minLength={8}
        />
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

      <button
        type="submit"
        disabled={busy || !token}
        className="w-full rounded-2xl bg-[#336699] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28547f] disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save new password"}
      </button>

      <p className="text-sm text-slate-600">
        <a href={loginHref} className="font-semibold text-slate-900 underline">
          Back to sign in
        </a>
      </p>
    </form>
  );
}
