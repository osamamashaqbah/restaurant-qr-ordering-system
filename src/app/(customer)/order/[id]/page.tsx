"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCustomerSession } from "@/lib/customer/SessionProvider";
import { formatPrice } from "@/lib/format";
import type { Enums } from "@/types/database";

type OrderStatus = Enums<"order_status">;

type PublicOrder = {
  id: string;
  table_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type OrderItemRow = {
  id: string;
  name_en: string;
  name_ar: string;
  unit_price: number;
  quantity: number;
  notes: string;
};

const STEPS: OrderStatus[] = ["new", "preparing", "ready", "closed"];

export default function OrderTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale, t } = useLocale();
  const { clearSession } = useCustomerSession();

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const [{ data: orderData, error: orderError }, { data: itemsData }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, table_number, status, total, created_at, updated_at, closed_at")
          .eq("id", id)
          .single(),
        supabase
          .from("order_items")
          .select("id, name_en, name_ar, unit_price, quantity, notes")
          .eq("order_id", id),
      ]);
      if (!active) return;
      if (orderError || !orderData) {
        setNotFound(true);
      } else {
        setOrder(orderData);
        setItems(itemsData ?? []);
      }
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => setOrder(payload.new as PublicOrder)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return null;
  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-charcoal-soft">404</p>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-charcoal">{t.tracker.title}</h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        {t.tracker.table}: <span className="font-medium text-charcoal">{order.table_number}</span>
      </p>

      {!isCancelled && (
        <div className="mt-6 flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-standard",
                  i <= currentStepIndex
                    ? "border-sage bg-sage text-white"
                    : "border-line text-charcoal-soft",
                ].join(" ")}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    "mx-1 h-0.5 flex-1 transition-standard",
                    i < currentStepIndex ? "bg-sage" : "bg-line",
                  ].join(" ")}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-line bg-cream-raised p-4">
        <p className="font-display text-lg font-semibold text-charcoal">
          {t.tracker.statuses[order.status]}
        </p>
        <p className="mt-1 text-sm text-charcoal-soft">{t.tracker.statusHelp[order.status]}</p>
      </div>

      <div className="ticket-edge mt-6 rounded-2xl border border-line bg-cream-raised p-5 pt-7">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {locale === "ar" ? item.name_ar : item.name_en}
              </span>
              <span className="tabular">{formatPrice(item.unit_price * item.quantity, locale)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-dashed border-line pt-3 text-base font-semibold">
          <span>{t.tracker.total}</span>
          <span className="tabular">{formatPrice(order.total, locale)}</span>
        </div>
      </div>

      {order.status === "closed" && (
        <Link
          href={`/rate/${order.id}`}
          className="mt-6 block rounded-xl bg-terracotta px-5 py-3.5 text-center font-semibold text-white transition-standard hover:bg-terracotta-dark"
        >
          {t.tracker.rate}
        </Link>
      )}

      {(order.status === "closed" || isCancelled) && (
        <Link
          href="/"
          onClick={clearSession}
          className="mt-3 block rounded-xl border border-line px-5 py-3 text-center font-medium text-charcoal-soft transition-standard hover:border-terracotta hover:text-terracotta"
        >
          {t.tracker.newOrder}
        </Link>
      )}
    </div>
  );
}
