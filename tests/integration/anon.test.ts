// @vitest-environment node
//
// Browser-facing Supabase checks that remain valid after the rewrite. Order
// creation/tracking/rating now go through the ASP.NET API, and direct legacy
// RPC denial is covered by legacy-rpc-lockdown.test.ts.
import { describe, expect, it } from "vitest";
import { anonClient } from "./helpers";

describe("anonymous direct reads", () => {
  it("cannot bypass the ASP.NET API to read menu items", async () => {
    const { data, error } = await anonClient().from("menu_items").select("id, is_available");
    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });
});

describe("anonymous direct writes", () => {
  it("cannot toggle menu item availability", async () => {
    const { data, error } = await anonClient()
      .from("menu_items")
      .update({ is_available: false })
      .eq("id", crypto.randomUUID());
    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });
});
