import { z } from "zod";
import { ALLERGEN_CODES } from "@/lib/i18n/allergens";

export const categorySchema = z.object({
  name_en: z.string().trim().min(1).max(60),
  name_ar: z.string().trim().min(1).max(60),
  sort_order: z.number().int().min(0).max(999),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const menuItemSchema = z.object({
  category_id: z.string().uuid("Choose a category"),
  name_en: z.string().trim().min(1).max(100),
  name_ar: z.string().trim().min(1).max(100),
  description_en: z.string().trim().max(500),
  description_ar: z.string().trim().max(500),
  price: z.number().min(0).max(9999.99),
  allergens: z.array(z.enum(ALLERGEN_CODES)),
  is_available: z.boolean(),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
