"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

type SalesSummary = {
  revenue: number;
  order_count: number;
  avg_order_value: number;
  daily: { day: string; revenue: number }[];
  top_items: { name_en: string; quantity: number; revenue: number }[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ReportsPanel() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return isoDate(d);
  });
  const [end, setEnd] = useState(() => isoDate(new Date()));
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const supabase = createClient();
    supabase
      .rpc("get_sales_summary", {
        p_start: `${start}T00:00:00Z`,
        p_end: `${end}T23:59:59Z`,
      })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError("Couldn't load the report.");
        } else {
          setSummary(data as SalesSummary);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [start, end]);

  const maxDaily = Math.max(1, ...(summary?.daily.map((d) => d.revenue) ?? [0]));

  return (
    <section>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From">
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={end}
            min={start}
            max={isoDate(new Date())}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
      {loading ? (
        <p className="mt-6 text-charcoal-soft">Loading…</p>
      ) : summary ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Revenue" value={formatPrice(summary.revenue, "en")} />
            <StatCard label="Closed orders" value={String(summary.order_count)} />
            <StatCard label="Avg. order value" value={formatPrice(summary.avg_order_value, "en")} />
          </div>

          <div className="mt-6">
            <h3 className="font-display text-base font-semibold text-charcoal">Revenue by day</h3>
            {summary.daily.length === 0 ? (
              <p className="mt-2 text-sm text-charcoal-soft">No closed orders in this range.</p>
            ) : (
              <div className="mt-3 flex items-end gap-2 overflow-x-auto rounded-xl border border-line bg-cream-raised p-4">
                {summary.daily.map((d) => (
                  <div key={d.day} className="flex w-14 shrink-0 flex-col items-center gap-1">
                    <span className="tabular text-xs text-charcoal-soft">
                      {formatPrice(d.revenue, "en")}
                    </span>
                    <div
                      className="w-6 rounded-t bg-terracotta"
                      style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 120)}px` }}
                    />
                    <span className="text-[10px] text-charcoal-soft">{d.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-display text-base font-semibold text-charcoal">Top items</h3>
            {summary.top_items.length === 0 ? (
              <p className="mt-2 text-sm text-charcoal-soft">No data yet.</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-cream-raised">
                {summary.top_items.map((item) => (
                  <div
                    key={item.name_en}
                    className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0"
                  >
                    <span className="text-sm text-charcoal">{item.name_en}</span>
                    <span className="tabular text-sm text-charcoal-soft">
                      {item.quantity}× · {formatPrice(item.revenue, "en")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-cream-raised p-4">
      <p className="text-xs font-medium text-charcoal-soft">{label}</p>
      <p className="tabular mt-1 font-display text-2xl font-semibold text-charcoal">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-charcoal-soft">{label}</label>
      {children}
    </div>
  );
}
