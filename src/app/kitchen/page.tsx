"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/database";

type OrderStatus = Enums<"order_status">;

type BoardOrder = {
  id: string;
  table_number: string;
  status: OrderStatus;
  created_at: string;
  order_items: {
    id: string;
    name_en: string;
    quantity: number;
    notes: string;
  }[];
};

const COLUMNS: { status: OrderStatus; title: string; nextStatus?: OrderStatus; action?: string }[] = [
  { status: "new", title: "New", nextStatus: "preparing", action: "Start preparing" },
  { status: "preparing", title: "Preparing", nextStatus: "ready", action: "Mark ready" },
  { status: "ready", title: "Ready", action: undefined },
];

export default function KitchenBoardPage() {
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, table_number, status, created_at, order_items(id, name_en, quantity, notes)")
      .in("status", ["new", "preparing", "ready"])
      .order("created_at", { ascending: true });
    setOrders((data as BoardOrder[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial board fetch on mount, then kept live via the subscription below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const advance = async (orderId: string, nextStatus: OrderStatus) => {
    setBusyId(orderId);
    const supabase = createClient();
    await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    setBusyId(null);
  };

  const cancel = async (orderId: string) => {
    if (!window.confirm("Cancel this order?")) return;
    setBusyId(orderId);
    const supabase = createClient();
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    setBusyId(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      {loading ? (
        <p className="text-charcoal-soft">Loading board…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-charcoal">{col.title}</h2>
                  <span className="tabular rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-charcoal-soft">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnOrders.length === 0 && (
                    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-charcoal-soft">
                      No orders
                    </p>
                  )}
                  {columnOrders.map((order) => {
                    const minutes = Math.max(0, Math.round((now - new Date(order.created_at).getTime()) / 60000));
                    const urgent = minutes >= 15 && col.status !== "ready";
                    return (
                      <div
                        key={order.id}
                        className={[
                          "rounded-2xl border bg-cream-raised p-4",
                          urgent ? "border-danger" : "border-line",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-display text-base font-semibold text-charcoal">
                            Table {order.table_number}
                          </span>
                          <span className={`tabular text-xs font-medium ${urgent ? "text-danger" : "text-charcoal-soft"}`}>
                            {minutes}m
                          </span>
                        </div>

                        <ul className="mt-2 flex flex-col gap-1">
                          {order.order_items.map((item) => (
                            <li key={item.id} className="text-sm text-charcoal">
                              <span className="tabular font-medium">{item.quantity}×</span> {item.name_en}
                              {item.notes && (
                                <span className="block text-xs italic text-charcoal-soft">{item.notes}</span>
                              )}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          {col.nextStatus && col.action && (
                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={() => advance(order.id, col.nextStatus!)}
                              className="flex-1 rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white transition-standard hover:bg-sage-dark disabled:opacity-60"
                            >
                              {col.action}
                            </button>
                          )}
                          {col.status !== "ready" && (
                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={() => cancel(order.id)}
                              className="text-xs text-charcoal-soft underline-offset-2 hover:text-danger hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
