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
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
  });

  test("fails closed when the local API has no database configuration", async ({ page }) => {
    await page.goto("/menu");

    await expect(page.getByText("We could not load the menu")).toBeVisible();
  });

  test("opens the beginner project guide", async ({ page }) => {
    await page.goto("/guide");

    await expect(page.getByRole("heading", { name: "دليل المشروع من الصفر إلى المقابلة" })).toBeVisible();
    await expect(page.getByText("Angular 22 + TypeScript")).toBeVisible();
    await expect(page.getByText("أسئلة ASP.NET Core")).toBeVisible();
  });
});
