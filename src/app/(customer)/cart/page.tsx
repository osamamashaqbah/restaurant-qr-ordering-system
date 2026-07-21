"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCustomerSession } from "@/lib/customer/SessionProvider";
import { useCart } from "@/lib/customer/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { session, hydrated: sessionHydrated } = useCustomerSession();
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionHydrated && !session) router.replace("/");
  }, [sessionHydrated, session, router]);

  const handleSubmit = async () => {
    if (!session || cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
      p_customer_name: session.name,
      p_customer_whatsapp: session.whatsapp,
      p_table_number: session.tableNumber,
      p_items: cart.items.map((i) => ({
        menu_item_id: i.menuItemId,
        quantity: i.quantity,
        notes: i.notes,
      })),
    });

    if (rpcError || !orderId) {
      setError(
        rpcError?.message?.includes("not available") ? t.cart.errorUnavailable : t.cart.errorGeneric
      );
      setSubmitting(false);
      return;
    }

    cart.clearCart();
    router.push(`/order/${orderId}`);
  };

  if (!sessionHydrated || !session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-5">
      <h1 className="font-display text-2xl font-semibold text-charcoal">{t.cart.title}</h1>

      {cart.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-charcoal-soft">{t.cart.empty}</p>
          <Link
            href="/menu"
            className="rounded-xl border border-terracotta px-5 py-2.5 font-semibold text-terracotta transition-standard hover:bg-terracotta hover:text-white"
          >
            {t.cart.browseMenu}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3">
            {cart.items.map((item) => (
              <div key={item.menuItemId} className="rounded-2xl border border-line bg-cream-raised p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-charcoal">
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </h3>
                  <span className="tabular text-sm font-semibold">
                    {formatPrice(item.price * item.quantity, locale)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <StepperButton
                      onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1)}
                      label="−"
                    />
                    <span className="w-5 text-center tabular text-sm font-semibold">{item.quantity}</span>
                    <StepperButton
                      onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1)}
                      label="+"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.menuItemId)}
                    className="text-sm text-charcoal-soft underline-offset-2 hover:text-danger hover:underline"
                  >
                    {t.cart.remove}
                  </button>
                </div>

                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => cart.updateNotes(item.menuItemId, e.target.value)}
                  placeholder={t.cart.notesPlaceholder}
                  maxLength={300}
                  className="mt-2 w-full rounded-lg border border-line bg-cream px-3 py-1.5 text-sm outline-none focus:border-terracotta"
                />
              </div>
            ))}
          </div>

          <Link
            href="/menu"
            className="mt-4 inline-block text-sm font-medium text-terracotta hover:underline"
          >
            + {t.cart.backToMenu}
          </Link>

          <div className="ticket-edge mt-6 rounded-2xl border border-line bg-cream-raised p-5 pt-7">
            <div className="flex justify-between text-sm text-charcoal-soft">
              <span>{t.cart.table}</span>
              <span className="font-medium text-charcoal">{session.tableNumber}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-dashed border-line pt-2 text-base font-semibold">
              <span>{t.cart.total}</span>
              <span className="tabular">{formatPrice(cart.total, locale)}</span>
            </div>

            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-terracotta px-5 py-3.5 font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-60"
            >
              {submitting ? t.cart.submitting : t.cart.submit}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StepperButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-charcoal transition-standard hover:border-terracotta hover:text-terracotta"
    >
      {label}
    </button>
  );
}
