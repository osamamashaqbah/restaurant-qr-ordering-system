// @vitest-environment node
//
// These tests sign in as real staff accounts and are SKIPPED by default.
// To run them: copy .env.test.example to .env.test, fill in real
// admin/cashier/kitchen credentials for accounts on the project in
// .env.local, then `npm run test`. Nothing here ever hardcodes or logs a
// password — they're read from your local, gitignored .env.test only.
import { describe, it, expect } from "vitest";
import {
  anonClient,
  staffClient,
  roleCreds,
  hasRoleCreds,
  hasAllRoleCreds,
  waitFor,
  testTableNumber,
} from "./helpers";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

async function availableMenuItem(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("menu_items")
    .select("id, price")
    .eq("is_available", true)
    .limit(1)
    .single();
  if (!data) throw new Error("No available menu item to test with.");
  return data;
}

describe.skipIf(!hasAllRoleCreds)("login scoping per role", () => {
  it("admin/cashier/kitchen each sign in and their profile role matches what's assigned", async () => {
    // get_my_role() is intentionally locked down (EXECUTE revoked from
    // authenticated — see 20260721121539_lock_down_internal_functions.sql)
    // and is never called by the app itself; it's an internal helper other
    // SECURITY DEFINER functions use. The app's own way of reading "my role"
    // is a direct select against profiles, gated by the profiles_select_own
    // RLS policy — so that's what this test exercises too.
    for (const role of ["admin", "cashier", "kitchen"] as const) {
      const client = await staffClient(roleCreds[role].email!, roleCreds[role].password!);
      const { data: user } = await client.auth.getUser();
      const { data, error } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.user!.id)
        .single();
      expect(error, `profile lookup failed for ${role}`).toBeNull();
      expect(data?.role, `expected ${role} account to have role="${role}"`).toBe(role);
    }
  });

  it("a kitchen session cannot advance an order past its allowed states (ready -> closed is cashier-only)", async () => {
    const kitchen = await staffClient(roleCreds.kitchen.email!, roleCreds.kitchen.password!);
    const anon = anonClient();
    const item = await availableMenuItem(anon);

    const { data: orderId } = await anon.rpc("create_order", {
      p_customer_name: "Role Scoping Test",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: item.id, quantity: 1, notes: "" }],
    });
    expect(orderId).toBeTruthy();

    // Kitchen can legitimately do new -> preparing -> ready...
    await kitchen.from("orders").update({ status: "preparing" }).eq("id", orderId as string);
    await kitchen.from("orders").update({ status: "ready" }).eq("id", orderId as string);
    const { data: afterKitchenWork } = await kitchen
      .from("orders")
      .select("status")
      .eq("id", orderId as string)
      .single();
    expect(afterKitchenWork?.status).toBe("ready");

    // ...but NOT ready -> closed, which is the cashier's job.
    await kitchen.from("orders").update({ status: "closed" }).eq("id", orderId as string);
    const { data: afterAttempt } = await kitchen
      .from("orders")
      .select("status")
      .eq("id", orderId as string)
      .single();
    expect(afterAttempt?.status).toBe("ready");
  });

  it("a cashier session cannot start preparing a new order (new -> preparing is kitchen-only)", async () => {
    const cashier = await staffClient(roleCreds.cashier.email!, roleCreds.cashier.password!);
    const anon = anonClient();
    const item = await availableMenuItem(anon);

    const { data: orderId } = await anon.rpc("create_order", {
      p_customer_name: "Role Scoping Test",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: item.id, quantity: 1, notes: "" }],
    });

    await cashier.from("orders").update({ status: "preparing" }).eq("id", orderId as string);
    const { data } = await cashier.from("orders").select("status").eq("id", orderId as string).single();
    expect(data?.status).toBe("new");
  });

  it.skipIf(!hasRoleCreds.admin)("only admin can list staff via list_staff()", async () => {
    const admin = await staffClient(roleCreds.admin.email!, roleCreds.admin.password!);
    const { data, error } = await admin.rpc("list_staff");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const kitchen = await staffClient(roleCreds.kitchen.email!, roleCreds.kitchen.password!);
    const { data: kitchenAttempt, error: kitchenError } = await kitchen.rpc("list_staff");
    // Either an outright error, or an empty/self-only result — either way,
    // a non-admin must not get the full staff roster.
    if (!kitchenError) {
      expect((kitchenAttempt ?? []).length).toBeLessThan((data ?? []).length);
    }
  });
});

describe.skipIf(!hasRoleCreds.cashier)("edge case: cashier closes an order that isn't Ready yet", () => {
  it("rejects closing a 'new' order (must go through preparing -> ready first)", async () => {
    const cashier = await staffClient(roleCreds.cashier.email!, roleCreds.cashier.password!);
    const anon = anonClient();
    const item = await availableMenuItem(anon);

    const { data: orderId } = await anon.rpc("create_order", {
      p_customer_name: "Edge Case Test",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: item.id, quantity: 1, notes: "" }],
    });
    expect(orderId).toBeTruthy();

    await cashier
      .from("orders")
      .update({ status: "closed", payment_confirmed: true })
      .eq("id", orderId as string);

    const { data } = await cashier.from("orders").select("status").eq("id", orderId as string).single();
    expect(data?.status).toBe("new");
  });

  it("also rejects closing a 'preparing' order (still not Ready)", async () => {
    const cashier = await staffClient(roleCreds.cashier.email!, roleCreds.cashier.password!);
    const kitchen = await staffClient(roleCreds.kitchen.email!, roleCreds.kitchen.password!);
    const anon = anonClient();
    const item = await availableMenuItem(anon);

    const { data: orderId } = await anon.rpc("create_order", {
      p_customer_name: "Edge Case Test",
      p_customer_whatsapp: "0791234567",
      p_table_number: testTableNumber(),
      p_items: [{ menu_item_id: item.id, quantity: 1, notes: "" }],
    });
    await kitchen.from("orders").update({ status: "preparing" }).eq("id", orderId as string);

    await cashier
      .from("orders")
      .update({ status: "closed", payment_confirmed: true })
      .eq("id", orderId as string);

    const { data } = await cashier.from("orders").select("status").eq("id", orderId as string).single();
    expect(data?.status).toBe("preparing");
  });
});

describe.skipIf(!hasAllRoleCreds)(
  "full lifecycle with realtime: kitchen -> ready pushes live to a cashier-side subscriber, then close unlocks rating",
  () => {
    it("propagates new -> preparing -> ready in realtime, then cashier closes and rating becomes reachable", async () => {
      const kitchen = await staffClient(roleCreds.kitchen.email!, roleCreds.kitchen.password!);
      const cashier = await staffClient(roleCreds.cashier.email!, roleCreds.cashier.password!);
      const anon = anonClient();
      const item = await availableMenuItem(anon);

      const { data: orderId } = await anon.rpc("create_order", {
        p_customer_name: "Lifecycle Test",
        p_customer_whatsapp: "0791234567",
        p_table_number: testTableNumber(),
        p_items: [{ menu_item_id: item.id, quantity: 1, notes: "" }],
      });
      expect(orderId).toBeTruthy();

      const seenStatuses: string[] = [];
      const channel = cashier
        .channel(`test-order-${orderId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
          (payload) => {
            seenStatuses.push((payload.new as { status: string }).status);
          }
        )
        .subscribe();

      // give the subscription a moment to actually establish before mutating
      await waitFor(() => channel.state === "joined", 5000);

      await kitchen.from("orders").update({ status: "preparing" }).eq("id", orderId as string);
      await waitFor(() => seenStatuses.includes("preparing"));
      await kitchen.from("orders").update({ status: "ready" }).eq("id", orderId as string);
      await waitFor(() => seenStatuses.includes("ready"));

      expect(seenStatuses).toContain("preparing");
      expect(seenStatuses).toContain("ready");

      await cashier
        .from("orders")
        .update({ status: "closed", payment_confirmed: true })
        .eq("id", orderId as string);

      const { data: closedOrder } = await anon
        .from("orders")
        .select("status")
        .eq("id", orderId as string)
        .single();
      expect(closedOrder?.status).toBe("closed");

      // Rating is only reachable (accepted) once the order is closed.
      const { error: ratingError } = await anon.rpc("submit_rating", {
        p_order_id: orderId as string,
        p_stars: 5,
        p_comment: "integration test",
      });
      expect(ratingError).toBeNull();

      // And can't be submitted a second time.
      const { error: duplicateError } = await anon.rpc("submit_rating", {
        p_order_id: orderId as string,
        p_stars: 4,
        p_comment: "duplicate attempt",
      });
      expect(duplicateError).not.toBeNull();

      await cashier.removeChannel(channel);
    }, 20000);
  }
);

describe.skipIf(!hasRoleCreds.cashier)(
  "menu availability toggle propagates to the customer-facing menu in realtime",
  () => {
    it("flips is_available and a subscribed anon client observes the change, then restores it", async () => {
      const cashier = await staffClient(roleCreds.cashier.email!, roleCreds.cashier.password!);
      const anon = anonClient();
      const { data: item } = await anon.from("menu_items").select("id, is_available").limit(1).single();
      if (!item) throw new Error("No menu item found.");

      const originalAvailability = item.is_available;
      let observed: boolean | null = null;

      const channel = anon
        .channel(`test-menu-item-${item.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "menu_items", filter: `id=eq.${item.id}` },
          (payload) => {
            observed = (payload.new as { is_available: boolean }).is_available;
          }
        )
        .subscribe();

      await waitFor(() => channel.state === "joined", 5000);

      await cashier.rpc("set_item_availability", {
        p_item_id: item.id,
        p_available: !originalAvailability,
      });

      const flipped = await waitFor(() => observed === !originalAvailability);
      expect(flipped, "customer-facing subscriber never saw the availability flip").toBe(true);

      // restore original state so re-running this suite doesn't drift seed data
      await cashier.rpc("set_item_availability", {
        p_item_id: item.id,
        p_available: originalAvailability,
      });

      await anon.removeChannel(channel);
    }, 15000);
  }
);
