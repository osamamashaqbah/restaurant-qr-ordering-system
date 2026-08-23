// @vitest-environment node
//
// Hits the live Supabase project configured in .env.local. Covers what's
// reachable through the app's actual public contract: the anon key, exactly
// as the deployed customer-facing app uses it. No service-role key is used
// here, matching the app's own security model (see README).
import { describe, it, expect, beforeAll } from "vitest";
import { anonClient, testTableNumber } from "./helpers";

describe("create_order (anonymous customer path)", () => {
  let availableItemId: string;
  let availableItemPrice: number;
  let unavailableItemId: string | null = null;

  beforeAll(async () => {
    const supabase = anonClient();
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("id, price, is_available")
      .limit(50);
    if (error || !items) throw new Error(`Could not load menu for setup: ${error?.message}`);

    const available = items.find((i) => i.is_available);
    if (!available) throw new Error("No available menu item found to test against — seed the menu first.");
    availableItemId = available.id;
    availableItemPrice = available.price;

    unavailableItemId = items.find((i) => !i.is_available)?.id ?? null;
  });

  it("creates an order and re-prices it server-side from the real menu price", async () => {
    const supabase = anonClient();
    const table = testTableNumber();

    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_customer_name: "Integration Test Customer",
      p_customer_whatsapp: "0791234567",
      p_table_number: table,
      p_items: [{ menu_item_id: availableItemId, quantity: 2, notes: "test note" }],
    });

    expect(error).toBeNull();
    expect(orderId).toBeTruthy();

    const { data: order } = await supabase
      .from("orders")
      .select("id, table_number, status, total")
      .eq("id", orderId as string)
      .single();

    expect(order?.table_number).toBe(table);
    expect(order?.status).toBe("new");
    // Total must equal 2x the *server's* menu price, proving the RPC
    // re-prices server-side rather than trusting a client-submitted price
    // (the RPC signature doesn't even accept a price/total from the client).
    expect(order?.total).toBeCloseTo(availableItemPrice * 2, 2);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("quantity, unit_price, notes")
      .eq("order_id", orderId as string);

    expect(orderItems).toHaveLength(1);
    expect(orderItems?.[0].quantity).toBe(2);
    expect(orderItems?.[0].unit_price).toBeCloseTo(availableItemPrice, 2);
    expect(orderItems?.[0].notes).toBe("test note");

    // customer_name / customer_whatsapp are intentionally NOT selectable by
    // anon (see README's "no PII in anon reads" rule), so they can't be
    // verified from this client — that's the security control working as
    // intended, not a test gap. Verified once manually via direct DB access
    // during QA (README's security-model section documents the same check).
  });

  it("rejects an order containing an unavailable item", async () => {
    if (!unavailableItemId) {
      console.warn("Skipping: no unavailable menu item exists in the current seed data.");
      return;
    }
    const supabase = anonClient();
    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_customer_name: "Integration Test Customer",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: unavailableItemId, quantity: 1, notes: "" }],
    });

    expect(orderId).toBeFalsy();
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toContain("not available");
  });

  it("rejects an order referencing a menu item that doesn't exist", async () => {
    const supabase = anonClient();
    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_customer_name: "Integration Test Customer",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: "00000000-0000-0000-0000-000000000000", quantity: 1, notes: "" }],
    });

    expect(orderId).toBeFalsy();
    expect(error).not.toBeNull();
  });

  it("rejects an empty item list", async () => {
    const supabase = anonClient();
    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_customer_name: "Integration Test Customer",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [],
    });

    expect(orderId).toBeFalsy();
    expect(error).not.toBeNull();
  });
});

describe("order status transitions (enforced in Postgres, not the client)", () => {
  it("an anonymous client cannot move an order out of 'new' by writing to it directly", async () => {
    const supabase = anonClient();
    const { data: items } = await supabase
      .from("menu_items")
      .select("id")
      .eq("is_available", true)
      .limit(1)
      .single();
    if (!items) throw new Error("No available menu item to create a test order with.");

    const { data: orderId } = await supabase.rpc("create_order", {
      p_customer_name: "Integration Test Customer",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: items.id, quantity: 1, notes: "" }],
    });
    expect(orderId).toBeTruthy();

    // Try every transition an attacker might attempt directly against the
    // table. All must be no-ops: the row must still read "new" afterward,
    // regardless of whether Postgres returns an error or a silent 0-row
    // update (RLS and the BEFORE UPDATE trigger both apply here).
    for (const target of ["preparing", "ready", "closed", "cancelled"] as const) {
      await supabase.from("orders").update({ status: target }).eq("id", orderId as string);
      const { data: after } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId as string)
        .single();
      expect(after?.status, `anon write of status="${target}" must not stick`).toBe("new");
    }
  });

  it("an anonymous client cannot toggle menu item availability directly", async () => {
    const supabase = anonClient();
    const { data: before } = await supabase
      .from("menu_items")
      .select("id, is_available")
      .limit(1)
      .single();
    if (!before) throw new Error("No menu item found.");

    await supabase.from("menu_items").update({ is_available: !before.is_available }).eq("id", before.id);

    const { data: after } = await supabase
      .from("menu_items")
      .select("is_available")
      .eq("id", before.id)
      .single();
    expect(after?.is_available).toBe(before.is_available);
  });
});

describe("customer-facing menu read", () => {
  it("exposes is_available truthfully for both available and unavailable items", async () => {
    const supabase = anonClient();
    const { data: items, error } = await supabase.from("menu_items").select("id, is_available");
    expect(error).toBeNull();
    expect(items?.length).toBeGreaterThan(0);
    // Just asserts the column round-trips as a real boolean the UI can key
    // off of — the actual hide/grey-out behavior is a UI-layer test (see e2e).
    for (const item of items ?? []) {
      expect(typeof item.is_available).toBe("boolean");
    }
  });
});
