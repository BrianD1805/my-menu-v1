type SalesPeriodKey = "daily" | "weekly" | "monthly";

type SalesMetric = {
  key: SalesPeriodKey;
  label: string;
  rangeLabel: string;
  totalLabel: string;
  orderCount: number;
};

type AdminSalesOverviewProps = {
  metrics: SalesMetric[];
};

const ORDERED_KEYS: SalesPeriodKey[] = ["daily", "weekly", "monthly"];

export default function AdminSalesOverview({ metrics }: AdminSalesOverviewProps) {
  const orderedMetrics = ORDERED_KEYS.map((key) => metrics.find((metric) => metric.key === key)).filter(
    (metric): metric is SalesMetric => Boolean(metric)
  );

  return (
    <section className="rounded-[30px] border border-[#DCE5E1] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B85A35]">Sales overview</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1F2328]">Daily, weekly and monthly sales</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4F535A]">
          A simple snapshot of store sales before you open the main admin areas.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {orderedMetrics.map((metric) => (
          <article key={metric.key} className="rounded-[26px] border border-[#DCE5E1] bg-[#F7FAF8] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0F766E]">{metric.label}</p>
                <p className="mt-2 text-sm font-semibold text-[#5A626B]">{metric.rangeLabel}</p>
              </div>
              <span className="rounded-full border border-[#DCE5E1] bg-white px-3 py-1 text-xs font-black text-[#1F2328]">
                {metric.orderCount} order{metric.orderCount === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight text-[#1F2328] sm:text-4xl">{metric.totalLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
