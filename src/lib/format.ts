import type { Locale } from "@/lib/i18n/dictionaries";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "JD";

export function formatPrice(amount: number, locale: Locale): string {
  const digits = amount.toLocaleString(locale === "ar" ? "ar-JO" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${digits} ${CURRENCY}`;
}
