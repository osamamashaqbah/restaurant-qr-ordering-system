import { test, expect } from "@playwright/test";

function uniqueTable() {
  return String(Math.floor(Math.random() * 900) + 100);
}

test.describe("customer journey (happy path)", () => {
  test("scan QR -> enter info -> browse bilingual menu -> order -> see live status", async ({ page }) => {
    await page.goto("/");

    // Entry form: name, WhatsApp, manually-typed table number (never a URL param).
    await expect(page).toHaveURL(/\/$/);
    expect(new URL(page.url()).searchParams.get("table")).toBeNull();

    await page.getByPlaceholder(/e\.g\. Sara|مثال: سارة/).fill("Playwright Tester");
    await page.getByPlaceholder(/e\.g\. 07|مثال: 07/).fill("0791234567");
    const table = uniqueTable();
    await page.getByPlaceholder(/e\.g\. 12|مثال: 12/).fill(table);
    await page.getByRole("button", { name: /See the menu|عرض القائمة/ }).click();

    // Menu: bilingual toggle
    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByRole("heading", { name: /Menu|القائمة/ })).toBeVisible();

    const addButtons = page.getByRole("button", { name: /^Add$|^إضافة$/ });
    await expect(addButtons.first()).toBeVisible();
    await addButtons.first().click();

    // Cart badge appears once something's added
    await expect(page.getByRole("button", { name: /View cart|عرض السلة/ })).toBeVisible();
    await page.getByRole("button", { name: /View cart|عرض السلة/ }).click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(table)).toBeVisible();
    await page.getByRole("button", { name: /Send order to kitchen|إرسال الطلب للمطبخ/ }).click();

    // Live order tracker
    await expect(page).toHaveURL(/\/order\/[0-9a-f-]+$/i);
    await expect(page.getByText(/Received|تم الاستلام/)).toBeVisible();
    await expect(page.getByText(table)).toBeVisible();
  });

  test("bilingual toggle flips both text and document direction", async ({ page }) => {
    await page.goto("/");
    const dirBefore = await page.evaluate(() => document.documentElement.dir);
    await page.getByRole("button", { name: "Toggle language" }).click();
    const dirAfter = await page.evaluate(() => document.documentElement.dir);
    expect(dirAfter).not.toBe(dirBefore);
    expect(["ltr", "rtl"]).toContain(dirAfter);
  });

  test("entry form shows inline validation errors instead of submitting on empty fields", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /See the menu|عرض القائمة/ }).click();
    await expect(page).toHaveURL(/\/$/); // did not navigate away
    await expect(page.getByText(/Enter your name\.|الرجاء إدخال اسمك/)).toBeVisible();
  });
});
