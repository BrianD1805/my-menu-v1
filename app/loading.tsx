export default function StorefrontLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F4F0] px-4 text-center">
      <section className="flex max-w-[320px] flex-col items-center justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center" aria-hidden="true">
          <span className="absolute h-20 w-20 rounded-full border border-orange-200/70 bg-white/70 shadow-[0_18px_50px_rgba(15,23,42,0.10)]" />
          <span className="absolute h-14 w-14 animate-ping rounded-full bg-orange-400/20" />
          <span className="absolute h-12 w-12 rounded-full border-4 border-orange-100" />
          <span className="absolute h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_8px_rgba(249,115,22,0.10)]" />
        </div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-orange-700">Orduva</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">We&apos;re getting things ready.</h1>
      </section>
    </main>
  );
}
