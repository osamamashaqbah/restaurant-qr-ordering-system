"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCart } from "@/lib/customer/CartProvider";

export function TopBar() {
  const { locale, setLocale, t } = useLocale();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold text-charcoal">
          {t.brand}
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-charcoal-soft transition-standard hover:border-terracotta hover:text-terracotta"
            aria-label="Toggle language"
          >
            {locale === "en" ? t.lang.ar : t.lang.en}
          </button>

          <Link
            href="/cart"
            className="relative rounded-full border border-line p-2 text-charcoal transition-standard hover:border-terracotta hover:text-terracotta"
            aria-label={t.menu.viewCart}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-xs font-semibold text-white tabular">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
