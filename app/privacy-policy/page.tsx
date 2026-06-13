import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

function defaultPrivacy(storeName: string) {
  return `${storeName} uses customer information to process orders, provide receipts, contact customers about orders, and support customer account services. We only use information needed to operate the store and keep order records. Contact the store directly if you need help with your data.`;
}

export default async function TenantPrivacyPolicyPage() {
  if (await isRootPlatformRequest()) notFound();
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const title = settings?.privacy_policy_title || "Privacy Policy";
  const body = settings?.privacy_policy_body || defaultPrivacy(branding.displayName);

  return (
    <main className="min-h-screen bg-[#F6F8F7] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <header className="border-b border-slate-200 bg-[#EAFBF5] px-5 py-6 sm:px-7">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">{branding.displayName}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
        </header>
        <section className="whitespace-pre-line px-5 py-6 text-sm leading-7 text-slate-700 sm:px-7">{body}</section>
        <footer className="border-t border-slate-200 px-5 py-4 sm:px-7">
          <Link href="/" className="text-sm font-black text-emerald-700 underline underline-offset-4">Back to store</Link>
        </footer>
      </article>
    </main>
  );
}
