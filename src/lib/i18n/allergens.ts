export const ALLERGEN_CODES = [
  "gluten",
  "dairy",
  "eggs",
  "nuts",
  "peanuts",
  "soy",
  "shellfish",
  "fish",
  "sesame",
] as const;

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const allergenLabels: Record<AllergenCode, { en: string; ar: string; emoji: string }> = {
  gluten: { en: "Gluten", ar: "غلوتين", emoji: "🌾" },
  dairy: { en: "Dairy", ar: "ألبان", emoji: "🥛" },
  eggs: { en: "Eggs", ar: "بيض", emoji: "🥚" },
  nuts: { en: "Tree nuts", ar: "مكسرات", emoji: "🌰" },
  peanuts: { en: "Peanuts", ar: "فول سوداني", emoji: "🥜" },
  soy: { en: "Soy", ar: "صويا", emoji: "🫘" },
  shellfish: { en: "Shellfish", ar: "محار", emoji: "🦐" },
  fish: { en: "Fish", ar: "سمك", emoji: "🐟" },
  sesame: { en: "Sesame", ar: "سمسم", emoji: "🫙" },
};

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value);
}
