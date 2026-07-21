"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCustomerSession } from "@/lib/customer/SessionProvider";
import { useCart } from "@/lib/customer/CartProvider";
import { formatPrice } from "@/lib/format";
import { allergenLabels, isAllergenCode } from "@/lib/i18n/allergens";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;

export default function MenuPage() {
  const router = useRouter();
  const { locale, dir, t } = useLocale();
  const { session, hydrated } = useCustomerSession();
  const cart = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hydrated && !session) router.replace("/");
  }, [hydrated, session, router]);

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
      .channel("menu-availability")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((i) => i.id !== (payload.old as MenuItem).id);
            }
            const updated = payload.new as MenuItem;
            const exists = prev.some((i) => i.id === updated.id);
            return exists
              ? prev.map((i) => (i.id === updated.id ? updated : i))
              : [...prev, updated];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category_id !== activeCategory) return false;
      if (!q) return true;
      const name = (locale === "ar" ? item.name_ar : item.name_en).toLowerCase();
      return name.includes(q);
    });
  }, [items, activeCategory, search, locale]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category_id) ?? [];
      list.push(item);
      map.set(item.category_id, list);
    }
    return map;
  }, [filteredItems]);

  if (!hydrated || !session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5">
      <h1 className="font-display text-2xl font-semibold text-charcoal">{t.menu.title}</h1>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.menu.searchPlaceholder}
        className="mt-4 w-full rounded-xl border border-line bg-cream-raised px-4 py-2.5 text-base outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <CategoryPill
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          label={locale === "ar" ? "الكل" : "All"}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            active={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            label={locale === "ar" ? cat.name_ar : cat.name_en}
          />
        ))}
      </div>

      {loading ? (
        <div className="mt-10 text-center text-charcoal-soft">…</div>
      ) : filteredItems.length === 0 ? (
        <p className="mt-10 text-center text-charcoal-soft">{t.menu.empty}</p>
      ) : activeCategory === "all" ? (
        categories
          .filter((cat) => itemsByCategory.has(cat.id))
          .map((cat) => (
            <section key={cat.id} className="mt-7">
              <h2 className="font-display text-lg font-semibold text-charcoal">
                {locale === "ar" ? cat.name_ar : cat.name_en}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {itemsByCategory.get(cat.id)!.map((item) => (
                  <ItemCard key={item.id} item={item} locale={locale} dir={dir} t={t} cart={cart} />
                ))}
              </div>
            </section>
          ))
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} locale={locale} dir={dir} t={t} cart={cart} />
          ))}
        </div>
      )}

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream-raised px-4 py-3">
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="mx-auto flex max-w-2xl w-full items-center justify-between rounded-xl bg-terracotta px-5 py-3.5 font-semibold text-white transition-standard hover:bg-terracotta-dark"
          >
            <span>{t.menu.viewCart}</span>
            <span className="tabular">
              {cart.count} · {formatPrice(cart.total, locale)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-standard",
        active
          ? "border-terracotta bg-terracotta text-white"
          : "border-line bg-cream-raised text-charcoal-soft hover:border-terracotta hover:text-terracotta",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ItemCard({
  item,
  locale,
  t,
  cart,
}: {
  item: MenuItem;
  locale: "en" | "ar";
  dir: "ltr" | "rtl";
  t: ReturnType<typeof useLocale>["t"];
  cart: ReturnType<typeof useCart>;
}) {
  const name = locale === "ar" ? item.name_ar : item.name_en;
  const description = locale === "ar" ? item.description_ar : item.description_en;
  const inCart = cart.items.find((i) => i.menuItemId === item.id);

  return (
    <div
      className={[
        "flex gap-3 rounded-2xl border border-line bg-cream-raised p-3 transition-standard",
        !item.is_available && "opacity-50",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line">
        {item.image_url && (
          <Image src={item.image_url} alt={name} fill sizes="80px" className="object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-charcoal">{name}</h3>
          <span className="shrink-0 tabular text-sm font-semibold text-charcoal">
            {formatPrice(item.price, locale)}
          </span>
        </div>
        {description && <p className="mt-0.5 line-clamp-2 text-sm text-charcoal-soft">{description}</p>}

        {item.allergens.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.allergens.filter(isAllergenCode).map((code) => (
              <span
                key={code}
                className="rounded-full bg-cream px-2 py-0.5 text-xs text-charcoal-soft"
                title={`${t.menu.allergens}: ${allergenLabels[code][locale]}`}
              >
                {allergenLabels[code].emoji} {allergenLabels[code][locale]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          {!item.is_available ? (
            <span className="text-xs font-medium text-danger">{t.menu.unavailable}</span>
          ) : inCart ? (
            <div className="flex items-center gap-2">
              <StepperButton onClick={() => cart.updateQuantity(item.id, inCart.quantity - 1)} label="−" />
              <span className="w-5 text-center tabular text-sm font-semibold">{inCart.quantity}</span>
              <StepperButton onClick={() => cart.updateQuantity(item.id, inCart.quantity + 1)} label="+" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                cart.addItem({
                  menuItemId: item.id,
                  nameEn: item.name_en,
                  nameAr: item.name_ar,
                  price: item.price,
                  imageUrl: item.image_url,
                })
              }
              className="rounded-lg border border-terracotta px-3 py-1 text-sm font-semibold text-terracotta transition-standard hover:bg-terracotta hover:text-white"
            >
              {t.menu.addToCart}
            </button>
          )}
        </div>
      </div>
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
