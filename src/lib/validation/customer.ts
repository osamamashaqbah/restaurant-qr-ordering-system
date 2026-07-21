import { z } from "zod";

// Mirrors the constraints enforced server-side in create_order() — this is a
// UX convenience layer only; the RPC is the real gate.
export const entrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(100, "nameTooLong"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "whatsappInvalid"),
  tableNumber: z
    .string()
    .trim()
    .min(1, "tableRequired")
    .max(20, "tableTooLong"),
});

export type EntryFormValues = z.infer<typeof entrySchema>;

export const cartItemNoteSchema = z.string().max(300);

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().default(""),
});
