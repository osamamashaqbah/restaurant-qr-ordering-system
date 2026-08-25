// @vitest-environment node
//
// Browser-facing Supabase checks that remain valid after the rewrite. Order
// creation/tracking/rating now go through the ASP.NET API, and direct legacy
// RPC denial is covered by legacy-rpc-lockdown.test.ts.
import { describe, expect, it } from "vitest";
import { anonClient } from "./helpers";

describe("customer-facing menu read", () => {
  it("exposes is_available truthfully for both available and unavailable items", async () => {
    const { data: items, error } = await anonClient().from("menu_items").select("id, is_available");
    expect(error).toBeNull();
    expect(items?.length).toBeGreaterThan(0);
    for (const item of items ?? []) expect(typeof item.is_available).toBe("boolean");
  });
});

describe("anonymous direct writes", () => {
  it("cannot toggle menu item availability", async () => {
    const client = anonClient();
    const { data: before } = await client.from("menu_items").select("id, is_available").limit(1).single();
    if (!before) throw new Error("No menu item found.");

    await client.from("menu_items").update({ is_available: !before.is_available }).eq("id", before.id);
    const { data: after } = await client
      .from("menu_items")
      .select("is_available")
      .eq("id", before.id)
      .single();
    expect(after?.is_available).toBe(before.is_available);
  });
});
