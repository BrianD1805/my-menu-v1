"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

type AccountState = {
  fullName: string;
  email: string;
  legalBusinessName: string;
  contactName: string;
  accountPhone: string;
  accountEmail: string;
  accountAddressLine1: string;
  accountAddressLine2: string;
  accountCity: string;
  accountRegion: string;
  accountPostcode: string;
  accountCountry: string;
  shipFromName: string;
  shipFromAddressLine1: string;
  shipFromAddressLine2: string;
  shipFromCity: string;
  shipFromRegion: string;
  shipFromPostcode: string;
  shipFromCountry: string;
  currentPasswordForEmail: string;
};

function Field({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <div className="mt-2">{children}</div>
      {help ? <span className="mt-1 block text-xs leading-5 text-slate-500">{help}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export default function TenantAccountManager({ initial }: { initial: AccountState }) {
  const [form, setForm] = useState<AccountState>(initial);
  const [savedEmail, setSavedEmail] = useState(initial.email);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  const update = <K extends keyof AccountState>(key: K, value: AccountState[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setTone("info");
    setMessage("Saving tenant account details...");
    try {
      const response = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save tenant account details");
      setSavedEmail(form.email);
      setForm((current) => ({ ...current, currentPasswordForEmail: "" }));
      setTone("success");
      setMessage("My Account details saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to save tenant account details");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setTone("error");
      setMessage("The new password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    setTone("info");
    setMessage("Changing password...");
    try {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to change password");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTone("success");
      setMessage("Password changed.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  const emailChanged = form.email.trim().toLowerCase() !== savedEmail.trim().toLowerCase();

  return (
    <div className="grid gap-5">
      {message ? (
        <div className={["rounded-[22px] border px-4 py-3 text-sm font-bold", tone === "error" ? "border-red-200 bg-red-50 text-red-800" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"].join(" ")}>{message}</div>
      ) : null}

      <form onSubmit={saveAccount} className="grid gap-5 rounded-[30px] border border-slate-200 bg-slate-50/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-6">
        <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">My Account</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Personal and login details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Full name"><input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></Field>
            <Field label="Login email"><input className={inputClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
            {emailChanged ? <div className="md:col-span-2"><Field label="Current password required to change email" help="For safety, enter your current password before changing the login email."><input className={inputClass} type="password" value={form.currentPasswordForEmail} onChange={(e) => update("currentPasswordForEmail", e.target.value)} /></Field></div> : null}
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Business details</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Account and optional address</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Legal business name"><input className={inputClass} value={form.legalBusinessName} onChange={(e) => update("legalBusinessName", e.target.value)} /></Field>
            <Field label="Main contact name"><input className={inputClass} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></Field>
            <Field label="Account phone"><input className={inputClass} value={form.accountPhone} onChange={(e) => update("accountPhone", e.target.value)} /></Field>
            <Field label="Account email"><input className={inputClass} type="email" value={form.accountEmail} onChange={(e) => update("accountEmail", e.target.value)} /></Field>
            <Field label="Address line 1"><input className={inputClass} value={form.accountAddressLine1} onChange={(e) => update("accountAddressLine1", e.target.value)} /></Field>
            <Field label="Address line 2"><input className={inputClass} value={form.accountAddressLine2} onChange={(e) => update("accountAddressLine2", e.target.value)} /></Field>
            <Field label="City"><input className={inputClass} value={form.accountCity} onChange={(e) => update("accountCity", e.target.value)} /></Field>
            <Field label="County / region"><input className={inputClass} value={form.accountRegion} onChange={(e) => update("accountRegion", e.target.value)} /></Field>
            <Field label="Postcode"><input className={inputClass} value={form.accountPostcode} onChange={(e) => update("accountPostcode", e.target.value)} /></Field>
            <Field label="Country"><input className={inputClass} value={form.accountCountry} onChange={(e) => update("accountCountry", e.target.value)} /></Field>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Fulfilment</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Orders shipped from</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Dispatch name"><input className={inputClass} value={form.shipFromName} onChange={(e) => update("shipFromName", e.target.value)} /></Field>
            <Field label="Address line 1"><input className={inputClass} value={form.shipFromAddressLine1} onChange={(e) => update("shipFromAddressLine1", e.target.value)} /></Field>
            <Field label="Address line 2"><input className={inputClass} value={form.shipFromAddressLine2} onChange={(e) => update("shipFromAddressLine2", e.target.value)} /></Field>
            <Field label="City"><input className={inputClass} value={form.shipFromCity} onChange={(e) => update("shipFromCity", e.target.value)} /></Field>
            <Field label="County / region"><input className={inputClass} value={form.shipFromRegion} onChange={(e) => update("shipFromRegion", e.target.value)} /></Field>
            <Field label="Postcode"><input className={inputClass} value={form.shipFromPostcode} onChange={(e) => update("shipFromPostcode", e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Country"><input className={inputClass} value={form.shipFromCountry} onChange={(e) => update("shipFromCountry", e.target.value)} /></Field></div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "Saving..." : "Save account details"}</button>
        </div>
      </form>

      <form onSubmit={changePassword} className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Security</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Change password</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Old password"><input className={inputClass} type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, oldPassword: e.target.value }))} /></Field>
          <Field label="New password"><input className={inputClass} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))} /></Field>
          <Field label="Confirm new password"><input className={inputClass} type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))} /></Field>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={passwordSaving} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">{passwordSaving ? "Changing..." : "Change password"}</button>
        </div>
      </form>
    </div>
  );
}
