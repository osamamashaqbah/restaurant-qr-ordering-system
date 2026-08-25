import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve("supabase/migrations/20260825160000_lock_down_legacy_public_rpcs.sql"),
  "utf8"
);

describe("legacy Supabase RPC lockdown", () => {
  it("removes browser-role execution from every superseded RPC", () => {
    for (const signature of [
      "public.create_order(text, text, text, jsonb)",
      "public.get_public_order(uuid)",
      "public.submit_rating(uuid, int, text)",
      "public.set_item_availability(uuid, boolean)",
      "public.get_sales_summary(timestamptz, timestamptz)",
      "public.list_staff()",
    ]) {
      expect(migration).toMatch(
        new RegExp(`revoke all on function ${signature.replace(/[()]/g, "\\$&")}\\s+from public, anon, authenticated;`)
      );
    }
  });
});
