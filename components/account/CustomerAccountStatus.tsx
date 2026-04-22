"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CustomerMe = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
};

export default function CustomerAccountStatus() {
  const [customer, setCustomer] = useState<CustomerMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/customer/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Checking account…
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">Customer account</p>
            <p className="text-slate-600">Sign in for a faster checkout and linked future orders.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/account/login"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/account/signup"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Signed in as {customer.fullName || customer.email}</p>
          <p className="text-emerald-800">{customer.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/account"
            className="rounded-xl border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Account
          </Link>
          <form action="/api/customer/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
