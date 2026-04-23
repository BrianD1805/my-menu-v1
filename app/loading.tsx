export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f3f5f3]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-[32px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.25s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.12s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
            </div>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Opening storefront
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Loading menu…
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
            The main ordering screen is loading first. Account and background features continue catching up behind the scenes.
          </p>
          <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/3 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-slate-900" />
          </div>
        </div>
      </div>
    </main>
  );
}
