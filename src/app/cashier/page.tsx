"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import type { Enums, Tables } from "@/types/database";

type OrderStatus = Enums<"order_status">;
type MenuItem = Tables<"menu_items">;
type Category = Tables<"categories">;

type StaffOrderItem = { id: string; name_en: string; quantity: number; unit_price: number };
type StaffOrder = {
  id: string;
  table_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_whatsapp: string;
  total: number;
  created_at: string;
  order_items: StaffOrderItem[];
};

type ClosedOrder = StaffOrder & { whatsappLink: string };

export default function CashierPage() {
  const [tab, setTab] = useState<"orders" | "availability">("orders");
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [justClosed, setJustClosed] = useState<ClosedOrder[]>([]);
  const knownReadyIds = useRef<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, table_number, status, customer_name, customer_whatsapp, total, created_at, order_items(id, name_en, quantity, unit_price)"
      )
      .in("status", ["new", "preparing", "ready"])
      .order("created_at", { ascending: true });

    const rows = (data as StaffOrder[]) ?? [];
    const newlyReady = rows.filter((o) => o.status === "ready" && !knownReadyIds.current.has(o.id));
    if (newlyReady.length > 0) {
      setFlashIds((prev) => new Set([...prev, ...newlyReady.map((o) => o.id)]));
      setTimeout(() => {
        setFlashIds((prev) => {
          const next = new Set(prev);
          newlyReady.forEach((o) => next.delete(o.id));
          return next;
        });
      }, 4000);
    }
    knownReadyIds.current = new Set(rows.filter((o) => o.status === "ready").map((o) => o.id));

    setOrders(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch on mount, then kept live via the subscription below.
    loadOrders();
    const supabase = createClient();
    const channel = supabase
      .channel("cashier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => loadOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const readyOrders = orders.filter((o) => o.status === "ready");
  const newCount = orders.filter((o) => o.status === "new").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  const closeOrder = async (order: StaffOrder) => {
    setBusyId(order.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "closed", payment_confirmed: true })
      .eq("id", order.id);
    setBusyId(null);

    if (!error) {
      const whatsappLink = buildInvoiceWhatsAppLink({
        customerName: order.customer_name,
        customerWhatsapp: order.customer_whatsapp,
        tableNumber: order.table_number,
        total: order.total,
        items: order.order_items.map((i) => ({
          nameEn: i.name_en,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
      });
      setJustClosed((prev) => [{ ...order, whatsappLink }, ...prev]);
    }
  };

  const dismissClosed = (orderId: string) => {
    setJustClosed((prev) => prev.filter((o) => o.id !== orderId));
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-6">
      <div className="flex items-center gap-2 border-b border-line">
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          Ready orders
          {readyOrders.length > 0 && (
            <span className="ms-2 rounded-full bg-terracotta px-2 py-0.5 text-xs font-semibold text-white tabular">
              {readyOrders.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "availability"} onClick={() => setTab("availability")}>
          Menu availability
        </TabButton>
      </div>

      {tab === "orders" ? (
        <div className="mt-5">
          <p className="text-sm text-charcoal-soft">
            {newCount} new · {preparingCount} preparing
          </p>

          {justClosed.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {justClosed.map((order) => (
                <div key={order.id} className="rounded-2xl border border-sage bg-cream-raised p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-charcoal">
                      Table {order.table_number} — Closed
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissClosed(order.id)}
                      className="text-xs text-charcoal-soft hover:text-charcoal"
                    >
                      Dismiss
                    </button>
                  </div>
                  <a
                    href={order.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white transition-standard hover:bg-sage-dark"
                  >
                    Send WhatsApp invoice
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {loading ? (
              <p className="text-charcoal-soft">Loading…</p>
            ) : readyOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-charcoal-soft">
                No orders ready yet
              </p>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className={[
                    "rounded-2xl border bg-cream-raised p-4 transition-standard",
                    flashIds.has(order.id) ? "border-terracotta ring-2 ring-terracotta/30" : "border-line",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-display text-base font-semibold text-charcoal">
                        Table {order.table_number}
                      </span>
                      <p className="text-sm text-charcoal-soft">{order.customer_name}</p>
                    </div>
                    <span className="tabular font-semibold text-charcoal">
                      {formatPrice(order.total, "en")}
                    </span>
                  </div>

                  <ul className="mt-2 flex flex-col gap-0.5">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="text-sm text-charcoal-soft">
                        <span className="tabular font-medium text-charcoal">{item.quantity}×</span>{" "}
                        {item.name_en}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => closeOrder(order)}
                    className="mt-3 w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-60"
                  >
                    Confirm payment & close
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <AvailabilityPanel />
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center px-1 pb-3 text-sm font-semibold transition-standard border-b-2 -mb-px",
        active ? "border-terracotta text-charcoal" : "border-transparent text-charcoal-soft hover:text-charcoal",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AvailabilityPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const [{ data: cats }, { data: menu }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("name_en"),
      ]);
      if (!active) return;
      setCategories(cats ?? []);
      setItems(menu ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("cashier-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === "DELETE") {
            return prev.filter((i) => i.id !== (payload.old as MenuItem).id);
          }
          const updated = payload.new as MenuItem;
          const exists = prev.some((i) => i.id === updated.id);
          return exists ? prev.map((i) => (i.id === updated.id ? updated : i)) : [...prev, updated];
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const toggle = async (item: MenuItem) => {
    setBusyId(item.id);
    const supabase = createClient();
    await supabase.rpc("set_item_availability", {
      p_item_id: item.id,
      p_available: !item.is_available,
    });
    setBusyId(null);
  };

  if (loading) return <p className="mt-5 text-charcoal-soft">Loading…</p>;

  return (
    <div className="mt-5 flex flex-col gap-6">
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        if (catItems.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className="font-display text-lg font-semibold text-charcoal">{cat.name_en}</h2>
            <div className="mt-2 flex flex-col divide-y divide-line rounded-xl border border-line bg-cream-raised">
              {catItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-charcoal">{item.name_en}</p>
                    <p className="tabular text-xs text-charcoal-soft">{formatPrice(item.price, "en")}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.is_available}
                    disabled={busyId === item.id}
                    onClick={() => toggle(item)}
                    className={[
                      "relative h-7 w-12 shrink-0 rounded-full transition-standard disabled:opacity-60",
                      item.is_available ? "bg-sage" : "bg-line",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-standard",
                        item.is_available ? "left-6" : "left-1",
                      ].join(" ")}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
