export type CountryCode = {
  code: string; // dial code digits only, no "+"
  nameEn: string;
  nameAr: string;
};

// Curated to the region this deployment actually serves — Jordan first as the
// default, plus common neighboring/Gulf countries. "other" lets a customer
// type any dial code by hand instead of being stuck picking from this list.
export const COUNTRY_CODES: CountryCode[] = [
  { code: "962", nameEn: "Jordan", nameAr: "الأردن" },
  { code: "966", nameEn: "Saudi Arabia", nameAr: "السعودية" },
  { code: "971", nameEn: "UAE", nameAr: "الإمارات" },
  { code: "970", nameEn: "Palestine", nameAr: "فلسطين" },
  { code: "20", nameEn: "Egypt", nameAr: "مصر" },
  { code: "965", nameEn: "Kuwait", nameAr: "الكويت" },
  { code: "974", nameEn: "Qatar", nameAr: "قطر" },
  { code: "973", nameEn: "Bahrain", nameAr: "البحرين" },
  { code: "968", nameEn: "Oman", nameAr: "عُمان" },
  { code: "964", nameEn: "Iraq", nameAr: "العراق" },
  { code: "961", nameEn: "Lebanon", nameAr: "لبنان" },
  { code: "963", nameEn: "Syria", nameAr: "سوريا" },
];

export const OTHER_COUNTRY_VALUE = "other";
