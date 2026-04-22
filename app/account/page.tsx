import { requireCustomerPageSession } from "@/lib/customer-auth";

export default async function CustomerAccountPage() {
  const { tenant, user } = await requireCustomerPageSession();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-5 lg:px-6">
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer account</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is the account foundation for {tenant.name}. Later builds can add order history, saved addresses, repeat order, and account-linked push notifications.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full name</p>
            <p className="mt-2 font-semibold text-slate-900">{user.full_name || "Customer"}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
            <p className="mt-2 font-semibold text-slate-900">{user.email}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
            <p className="mt-2 font-semibold text-slate-900">{user.phone || "Not added yet"}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session</p>
            <p className="mt-2 font-semibold text-slate-900">Signed in</p>
          </div>
        </div>

        <form action="/api/customer/auth/logout" method="post" className="mt-6">
          <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
