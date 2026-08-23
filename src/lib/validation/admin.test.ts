import { describe, it, expect } from "vitest";
import { categorySchema, menuItemSchema } from "./admin";

describe("categorySchema", () => {
  it("accepts a valid category", () => {
    expect(
      categorySchema.safeParse({ name_en: "Starters", name_ar: "مقبلات", sort_order: 1 }).success
    ).toBe(true);
  });

  it("rejects an empty English name", () => {
    expect(
      categorySchema.safeParse({ name_en: "", name_ar: "مقبلات", sort_order: 1 }).success
    ).toBe(false);
  });

  it("rejects a negative sort order", () => {
    expect(
      categorySchema.safeParse({ name_en: "Starters", name_ar: "مقبلات", sort_order: -1 }).success
    ).toBe(false);
  });
});

describe("menuItemSchema", () => {
  const valid = {
    category_id: "8c9c6f0a-1e1a-4e21-9b3c-000000000001",
    name_en: "Hummus",
    name_ar: "حمص",
    description_en: "Creamy chickpea dip",
    description_ar: "حمص كريمي",
    price: 3.5,
    allergens: ["sesame"] as const,
    is_available: true,
  };

  it("accepts a valid item", () => {
    expect(menuItemSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-UUID category_id", () => {
    expect(menuItemSchema.safeParse({ ...valid, category_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(menuItemSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });

  it("rejects a price over 9999.99", () => {
    expect(menuItemSchema.safeParse({ ...valid, price: 10000 }).success).toBe(false);
  });

  it("rejects an unknown allergen code", () => {
    const r = menuItemSchema.safeParse({ ...valid, allergens: ["chocolate"] });
    expect(r.success).toBe(false);
  });

  it("accepts an empty allergen list", () => {
    expect(menuItemSchema.safeParse({ ...valid, allergens: [] }).success).toBe(true);
  });
});
