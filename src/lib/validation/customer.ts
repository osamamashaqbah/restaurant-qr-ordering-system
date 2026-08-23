import { z } from "zod";

// Mirrors the constraints enforced server-side in create_order() — this is a
// UX convenience layer only; the RPC is the real gate.
//
// WhatsApp is split into a country dial code + a local number rather than one
// free-text field: customers type their number the way they normally would
// (local format), and pick their country instead of us assuming Jordan for
// everyone — a plain "0791234567" from a non-Jordanian visitor would
// otherwise get silently mis-prefixed with the wrong country code.
export const entrySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "nameRequired")
      .max(100, "nameTooLong"),
    countryCode: z
      .string()
      .trim()
      .regex(/^[0-9]{1,4}$/, "whatsappInvalid"),
    whatsappLocal: z
      .string()
      .trim()
      .regex(/^0?[0-9]{6,12}$/, "whatsappInvalid"),
    tableNumber: z
      .string()
      .trim()
      .min(1, "tableRequired")
      .max(20, "tableTooLong"),
  })
  .superRefine(({ countryCode, whatsappLocal }, ctx) => {
    if (!/^[0-9]{7,15}$/.test(toInternationalWhatsApp(countryCode, whatsappLocal))) {
      ctx.addIssue({ code: "custom", path: ["whatsappLocal"], message: "whatsappInvalid" });
    }
  });

export type EntryFormValues = z.infer<typeof entrySchema>;

// Combines the picked dial code with the typed local number into the single
// full international number the RPC and WhatsApp links expect — dropping a
// leading trunk "0" from the local part, since dial codes already replace it.
export function toInternationalWhatsApp(countryCode: string, whatsappLocal: string): string {
  return `${countryCode}${whatsappLocal.replace(/^0+/, "")}`;
}

export const cartItemNoteSchema = z.string().max(300);

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().default(""),
});
