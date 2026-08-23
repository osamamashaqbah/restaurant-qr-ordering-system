import { test, expect, type Browser } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { hasRoleCreds, roleCreds } from "./helpers";

function uniqueTable() {
  return String(Math.floor(Math.random() * 900) + 100);
}

async function orderAsCustomer(
  browser: Browser,
  opts: { name: string; whatsapp: string; table: string; itemIndex?: number }
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.getByPlaceholder(/e\.g\. Sara|مثال: سارة/).fill(opts.name);
  await page.getByPlaceholder(/e\.g\. 07|مثال: 07/).fill(opts.whatsapp);
  await page.getByPlaceholder(/e\.g\. 12|مثال: 12/).fill(opts.table);
  await page.getByRole("button", { name: /See the menu|عرض القائمة/ }).click();
  const addButtons = page.getByRole("button", { name: /^Add$|^إضافة$/ });
  await addButtons.nth(opts.itemIndex ?? 0).click();
  await page.getByRole("button", { name: /View cart|عرض السلة/ }).click();
  await page.getByRole("button", { name: /Send order to kitchen|إرسال الطلب للمطبخ/ }).click();
  await expect(page).toHaveURL(/\/order\/[0-9a-f-]+$/i);
  return { context, page, orderId: page.url().split("/order/")[1] };
}

test.describe("edge case: two customers ordering from the same table simultaneously", () => {
  test("both submissions succeed as independent orders, not merged or blocked", async ({ browser }) => {
    const table = uniqueTable();
    const [a, b] = await Promise.all([
      orderAsCustomer(browser, { name: "Customer A", whatsapp: "0791111111", table }),
      orderAsCustomer(browser, { name: "Customer B", whatsapp: "0792222222", table }),
    ]);

    expect(a.orderId).toBeTruthy();
    expect(b.orderId).toBeTruthy();
    expect(a.orderId).not.toBe(b.orderId);

    await expect(a.page.getByText(table)).toBeVisible();
    await expect(b.page.getByText(table)).toBeVisible();

    await a.context.close();
    await b.context.close();
  });
});

test.describe("edge case: item goes out of stock while a customer has it in an open cart", () => {
  test.skip(!hasRoleCreds.admin, "requires TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD in .env.test");

  test("checkout is rejected with a clear message once the item is toggled unavailable mid-session", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.getByPlaceholder(/e\.g\. Sara|مثال: سارة/).fill("Stale Cart Tester");
    await page.getByPlaceholder(/e\.g\. 07|مثال: 07/).fill("0793334444");
    await page.getByPlaceholder(/e\.g\. 12|مثال: 12/).fill(uniqueTable());
    await page.getByRole("button", { name: /See the menu|عرض القائمة/ }).click();

    const itemName = await page.getByRole("heading", { level: 3 }).first().innerText();
    await page.getByRole("button", { name: /^Add$|^إضافة$/ }).first().click();

    // Flip that same item unavailable out from under the open cart, using an
    // authenticated admin session in a second, independent browser context —
    // mirrors the admin dashboard's own write path (direct table update).
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await admin.auth.signInWithPassword({
      email: roleCreds.admin.email!,
      password: roleCreds.admin.password!,
    });
    const { data: item } = await admin
      .from("menu_items")
      .select("id, is_available")
      .eq("name_en", itemName)
      .single();
    expect(item).toBeTruthy();
    await admin.from("menu_items").update({ is_available: false }).eq("id", item!.id);

    try {
      await page.getByRole("button", { name: /View cart|عرض السلة/ }).click();
      await page.getByRole("button", { name: /Send order to kitchen|إرسال الطلب للمطبخ/ }).click();
      await expect(
        page.getByText(/became unavailable|لم يعد متوفراً/)
      ).toBeVisible();
      await expect(page).toHaveURL(/\/cart$/); // did not proceed to the tracker
    } finally {
      // restore
      await admin.from("menu_items").update({ is_available: true }).eq("id", item!.id);
      await context.close();
    }
  });
});

test.describe("edge case: cashier tries to close an order that isn't yet Ready", () => {
  test.skip(!hasRoleCreds.cashier, "requires TEST_CASHIER_EMAIL/TEST_CASHIER_PASSWORD in .env.test");

  test("a freshly-placed order never appears in the cashier's ready-to-close list", async ({ browser }) => {
    const table = uniqueTable();
    const customer = await orderAsCustomer(browser, {
      name: "Not Ready Tester",
      whatsapp: "0795556666",
      table,
    });

    const cashierContext = await browser.newContext();
    const cashierPage = await cashierContext.newPage();
    await cashierPage.goto("/login");
    await cashierPage.getByLabel(/^Email$/).fill(roleCreds.cashier.email!);
    await cashierPage.getByLabel(/^Password$/).fill(roleCreds.cashier.password!);
    await cashierPage.getByRole("button", { name: /Sign in/ }).click();
    await expect(cashierPage).toHaveURL(/\/cashier$/);

    // The "new" order must not show up under Ready orders — there's no UI
    // affordance to close it at all until the kitchen marks it Ready.
    await expect(cashierPage.getByText(`Table ${table}`)).not.toBeVisible();

    await customer.context.close();
    await cashierContext.close();
  });
});

test.describe("edge case: malformed order link", () => {
  test("a garbage order id shows a graceful 404, not a crash or leaked error", async ({ page }) => {
    await page.goto("/order/not-a-real-order-id");
    await expect(page.getByText("404")).toBeVisible();
    // No stack trace / internal error text leaked to the client.
    const body = await page.textContent("body");
    expect(body).not.toMatch(/postgrest|supabase|stack|at Object\./i);
  });

  test("table number is never read from the URL, so there is no QR payload to malform in the first place", async ({
    page,
  }) => {
    // The spec explicitly requires the table number to be a manually-typed
    // field, never decoded from the QR/URL — so unlike per-table QR systems,
    // there's no ?table=... parameter whose malformation could be tested.
    // This documents that architectural choice rather than a skipped test.
    await page.goto("/?table=999&malformed=<script>");
    await expect(page.getByPlaceholder(/e\.g\. 12|مثال: 12/)).toHaveValue("");
  });
});
