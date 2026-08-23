import { describe, it, expect, vi } from "vitest";
import { buildInvoiceWhatsAppLink } from "./whatsapp";

const baseOrder = {
  customerName: "Sara",
  tableNumber: "7",
  total: 13.0,
  items: [
    { nameEn: "Hummus", quantity: 2, unitPrice: 3.5 },
    { nameEn: "Ayran", quantity: 3, unitPrice: 2.0 },
  ],
};

describe("buildInvoiceWhatsAppLink", () => {
  it("builds a wa.me link with the phone in the path and no plus/leading zero", () => {
    const link = buildInvoiceWhatsAppLink({ ...baseOrder, customerWhatsapp: "0791234567" });
    expect(link).toMatch(/^https:\/\/wa\.me\/962791234567\?text=/);
  });

  it("leaves an already-international number untouched", () => {
    const link = buildInvoiceWhatsAppLink({ ...baseOrder, customerWhatsapp: "962791234567" });
    expect(link).toMatch(/^https:\/\/wa\.me\/962791234567\?text=/);
  });

  it("strips non-digit characters from the phone number", () => {
    const link = buildInvoiceWhatsAppLink({ ...baseOrder, customerWhatsapp: "+962 79-123 4567" });
    expect(link).toMatch(/^https:\/\/wa\.me\/962791234567\?text=/);
  });

  it("URL-encodes the receipt text and includes customer name, table, items, and total", () => {
    const link = buildInvoiceWhatsAppLink({ ...baseOrder, customerWhatsapp: "0791234567" });
    const text = decodeURIComponent(link.split("?text=")[1]);
    expect(text).toContain("Hi Sara, here's your receipt:");
    expect(text).toContain("Table 7");
    expect(text).toContain("2x Hummus — 7.00 JD");
    expect(text).toContain("3x Ayran — 6.00 JD");
    expect(text).toContain("Total: 13.00 JD");
  });

  it("respects a custom currency env var", async () => {
    const previousCurrency = process.env.NEXT_PUBLIC_CURRENCY;
    process.env.NEXT_PUBLIC_CURRENCY = "USD";
    vi.resetModules();
    try {
      const mod = await import("./whatsapp");
      const link = mod.buildInvoiceWhatsAppLink({ ...baseOrder, customerWhatsapp: "0791234567" });
      expect(decodeURIComponent(link)).toContain("USD");
    } finally {
      if (previousCurrency === undefined) delete process.env.NEXT_PUBLIC_CURRENCY;
      else process.env.NEXT_PUBLIC_CURRENCY = previousCurrency;
      vi.resetModules();
    }
  });
});
