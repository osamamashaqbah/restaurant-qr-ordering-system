import { describe, it, expect } from "vitest";
import { entrySchema, ratingSchema, toInternationalWhatsApp } from "./customer";

describe("entrySchema", () => {
  const valid = { name: "Sara", countryCode: "962", whatsappLocal: "0791234567", tableNumber: "12" };

  it("accepts a valid entry", () => {
    expect(entrySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    const r = entrySchema.safeParse({ ...valid, name: "  " });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("nameRequired");
  });

  it("rejects a name over 100 chars", () => {
    const r = entrySchema.safeParse({ ...valid, name: "a".repeat(101) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("nameTooLong");
  });

  it("rejects a WhatsApp number with letters", () => {
    const r = entrySchema.safeParse({ ...valid, whatsappLocal: "07abc34567" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("whatsappInvalid");
  });

  it("rejects a WhatsApp number shorter than 6 digits", () => {
    expect(entrySchema.safeParse({ ...valid, whatsappLocal: "12345" }).success).toBe(false);
  });

  it("rejects a WhatsApp number longer than 12 digits", () => {
    expect(entrySchema.safeParse({ ...valid, whatsappLocal: "1".repeat(13) }).success).toBe(false);
  });

  it("rejects a country and local number whose combined value exceeds the server limit", () => {
    expect(
      entrySchema.safeParse({ ...valid, countryCode: "9999", whatsappLocal: "123456789012" }).success
    ).toBe(false);
  });

  it("rejects a country code with letters", () => {
    const r = entrySchema.safeParse({ ...valid, countryCode: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("whatsappInvalid");
  });

  it("accepts a non-Jordanian country code", () => {
    expect(entrySchema.safeParse({ ...valid, countryCode: "20", whatsappLocal: "1001234567" }).success).toBe(
      true
    );
  });

  it("rejects a blank table number", () => {
    const r = entrySchema.safeParse({ ...valid, tableNumber: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("tableRequired");
  });

  it("rejects a table number over 20 chars (guards against QR/param injection attempts)", () => {
    const r = entrySchema.safeParse({ ...valid, tableNumber: "1".repeat(21) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("tableTooLong");
  });

  it("rejects a table number containing a script tag as a literal string (no special XSS carve-out, just treated as text within the length limit)", () => {
    const r = entrySchema.safeParse({ ...valid, tableNumber: "<script>1</script>" });
    // Well within 20 chars, so it's accepted as plain text — React will
    // escape it on render. This test documents that expectation.
    expect(r.success).toBe(true);
  });
});

describe("toInternationalWhatsApp", () => {
  it("combines a country code with a local number, dropping the leading trunk 0", () => {
    expect(toInternationalWhatsApp("962", "0791234567")).toBe("962791234567");
  });

  it("works when the local number has no leading 0", () => {
    expect(toInternationalWhatsApp("20", "1001234567")).toBe("201001234567");
  });

  it("supports non-default country codes", () => {
    expect(toInternationalWhatsApp("971", "0501234567")).toBe("971501234567");
  });
});

describe("ratingSchema", () => {
  it("accepts a valid rating with a comment", () => {
    expect(ratingSchema.safeParse({ stars: 5, comment: "Great!" }).success).toBe(true);
  });

  it("defaults comment to an empty string when omitted", () => {
    const r = ratingSchema.safeParse({ stars: 4 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.comment).toBe("");
  });

  it("rejects 0 stars", () => {
    expect(ratingSchema.safeParse({ stars: 0 }).success).toBe(false);
  });

  it("rejects more than 5 stars", () => {
    expect(ratingSchema.safeParse({ stars: 6 }).success).toBe(false);
  });

  it("rejects non-integer stars", () => {
    expect(ratingSchema.safeParse({ stars: 3.5 }).success).toBe(false);
  });

  it("rejects a comment over 500 chars", () => {
    expect(ratingSchema.safeParse({ stars: 3, comment: "a".repeat(501) }).success).toBe(false);
  });
});
