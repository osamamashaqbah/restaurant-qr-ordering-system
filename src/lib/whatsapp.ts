const DEFAULT_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "962";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "JD";

// wa.me requires a full international number with no leading zero or "+".
// Customers only ever type a local-format number (e.g. "0791234567"), so we
// best-effort normalize it using a deployment-configured default country
// code. Numbers already typed in international form (e.g. "962791234567")
// are left as-is.
function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits;
  if (digits.startsWith("0")) return DEFAULT_COUNTRY_CODE + digits.slice(1);
  return digits;
}

export function buildInvoiceWhatsAppLink(order: {
  customerName: string;
  customerWhatsapp: string;
  tableNumber: string;
  total: number;
  items: { nameEn: string; quantity: number; unitPrice: number }[];
}): string {
  const lines = [
    `Hi ${order.customerName}, here's your receipt:`,
    `Table ${order.tableNumber}`,
    "",
    ...order.items.map(
      (i) => `${i.quantity}x ${i.nameEn} — ${(i.unitPrice * i.quantity).toFixed(2)} ${CURRENCY}`
    ),
    "",
    `Total: ${order.total.toFixed(2)} ${CURRENCY}`,
    "",
    "Thank you for visiting!",
  ];

  const phone = normalizeWhatsAppNumber(order.customerWhatsapp);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${text}`;
}
