import { test, expect } from "@playwright/test";

test.describe("Angular rewrite smoke checks", () => {
  test("does not read table data from the URL and validates empty entry", async ({ page }) => {
    await page.goto("/?table=999");

    await expect(page.getByLabel("Table number")).toHaveValue("");
    await page.getByRole("button", { name: "See the menu" }).click();

    await expect(page.getByText(/Name is required/)).toBeVisible();
    await expect(page).toHaveURL(/\/\?table=999$/);
  });

  test("renders a safe state for a malformed public order token", async ({ page }) => {
    await page.goto("/order/not-a-real-order-id");

    await expect(page.getByText("invalid or has expired")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/stack|postgrest|supabase/i);
  });

  test("redirects signed-out staff routes to login with the return path", async ({ page }) => {
    await page.goto("/kitchen");

    await expect(page).toHaveURL(/\/login\?next=%2Fkitchen$/);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  });

  test("keeps customer and staff surfaces inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const path of ["/", "/menu", "/cart", "/order", "/rate", "/login", "/guide"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("gives public images and controls accessible names", async ({ page }) => {
    for (const path of ["/", "/menu", "/cart", "/order", "/rate", "/login"]) {
      await page.goto(path);
      await expect(page.locator("img:not([alt])")).toHaveCount(0);
      expect(await page.locator("button, a[href]").evaluateAll((elements) => elements.filter((element) =>
        !element.textContent?.trim() && !element.getAttribute("aria-label") && !element.getAttribute("title"),
      ).length)).toBe(0);
      expect(await page.locator("input, select, textarea").evaluateAll((elements) => elements.filter((element) =>
        !(element as HTMLInputElement).labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby"),
      ).length)).toBe(0);
    }
  });

  test("renders the menu or a safe unavailable state", async ({ page }) => {
    await page.goto("/menu");

    await expect(
      page
        .getByRole("heading", { name: "Starters" })
        .or(page.getByText("We could not load the menu")),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("opens the beginner project guide", async ({ page }) => {
    await page.goto("/guide");

    await expect(page.getByRole("heading", { name: "دليل المشروع من الصفر إلى المقابلة" })).toBeVisible();
    await expect(page.getByText("Angular 22 + TypeScript")).toBeVisible();
    await expect(page.getByText("أسئلة ASP.NET Core")).toBeVisible();
  });
});
