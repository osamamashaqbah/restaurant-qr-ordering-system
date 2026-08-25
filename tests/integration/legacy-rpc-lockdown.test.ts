// @vitest-environment node
//
// This is a staging-only security regression test. It deliberately uses the
// anonymous browser credentials and must run after the migration is applied.
import { beforeAll, describe, expect, it } from "vitest";
import { anonClient, testTableNumber } from "./helpers";

const runSecurityTests = process.env.RUN_SUPABASE_SECURITY_TESTS === "true";
const permissionOrMissingRpc = new Set(["42501", "PGRST202", "42883"]);

describe.skipIf(!runSecurityTests)("legacy RPCs are unreachable from the browser", () => {
  let availableItemId: string;

  beforeAll(async () => {
    const { data, error } = await anonClient()
      .from("menu_items")
      .select("id")
      .eq("is_available", true)
      .limit(1)
      .single();
    if (error || !data) throw new Error(`Staging menu setup failed: ${error?.message}`);
    availableItemId = data.id;
  });

  it("denies the old raw-order and raw-order-id RPCs", async () => {
    const client = anonClient();
    const attempts = await Promise.all([
      client.rpc("create_order", {
        p_customer_name: "Security Test",
        p_customer_whatsapp: "0791234567",
        p_table_number: testTableNumber(),
        p_items: [{ menu_item_id: availableItemId, quantity: 1, notes: "" }],
      }),
      client.rpc("get_public_order", { p_order_id: "00000000-0000-0000-0000-000000000000" }),
      client.rpc("submit_rating", {
        p_order_id: "00000000-0000-0000-0000-000000000000",
        p_stars: 5,
        p_comment: "security test",
      }),
    ]);

    for (const attempt of attempts) {
      expect(attempt.data).toBeNull();
      expect(attempt.error?.code).toSatisfy((code: string | undefined) => permissionOrMissingRpc.has(code ?? ""));
    }
  });
});
