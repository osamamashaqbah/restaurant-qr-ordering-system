import path from "node:path";
import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are required to run integration tests (read from .env.local)."
  );
}

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(url!, anonKey!);
}

export async function staffClient(
  email: string,
  password: string
): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(url!, anonKey!);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Staff sign-in failed for ${email}: ${error.message}`);
  return client;
}

export const roleCreds = {
  admin: { email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD },
  cashier: { email: process.env.TEST_CASHIER_EMAIL, password: process.env.TEST_CASHIER_PASSWORD },
  kitchen: { email: process.env.TEST_KITCHEN_EMAIL, password: process.env.TEST_KITCHEN_PASSWORD },
};

export const hasRoleCreds = {
  admin: !!(roleCreds.admin.email && roleCreds.admin.password),
  cashier: !!(roleCreds.cashier.email && roleCreds.cashier.password),
  kitchen: !!(roleCreds.kitchen.email && roleCreds.kitchen.password),
};

export const hasAllRoleCreds = hasRoleCreds.admin && hasRoleCreds.cashier && hasRoleCreds.kitchen;

/** Poll until `check()` returns true or the timeout elapses. Used instead of
 * a fixed sleep so realtime-propagation tests aren't flaky on slower CI. */
export async function waitFor(check: () => boolean | Promise<boolean>, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

/** A distinctive, greppable table number so test-created orders are easy to
 * spot (and later purge) in a shared dev project. There's no client-writable
 * delete path for orders by design (see README's security model), so these
 * rows are intentionally left behind rather than worked around.
 *
 * create_order() enforces length(p_table_number) <= 20 server-side, so this
 * has to stay well under that — a base36 timestamp keeps it short and still
 * unique enough per test run. */
export function testTableNumber() {
  return `T${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
