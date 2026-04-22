import { requireCustomerPageSession } from "@/lib/customer-auth";

export default async function CustomerAccountPage() {
  const { tenant, user } = await requireCustomerPageSession();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-5 lg:px-6">
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer account</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          You are signed in for {tenant.name}. Return to the storefront to place linked orders with your customer account, then we can build order history and account-linked push next.
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

        <div className="mt-6 flex flex-wrap gap-3"><a href="/" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">Back to storefront</a><form action="/api/customer/auth/logout?next=/" method="post">
          <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sign out
          </button>
        </form></div>
      </section>
    </main>
  );
}
