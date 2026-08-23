import { test, expect } from "@playwright/test";
import { hasRoleCreds, roleCreds } from "./helpers";

const DASHBOARDS = {
  admin: { path: "/admin", heading: /Menu|Admin/ },
  cashier: { path: "/cashier", heading: /Ready orders/ },
  kitchen: { path: "/kitchen", heading: /New|Preparing|Ready/ },
} as const;

async function loginAs(page: import("@playwright/test").Page, role: keyof typeof roleCreds) {
  await page.goto("/login");
  await page.getByLabel(/^Email$/).fill(roleCreds[role].email!);
  await page.getByLabel(/^Password$/).fill(roleCreds[role].password!);
  await page.getByRole("button", { name: /Sign in/ }).click();
}

for (const role of ["admin", "cashier", "kitchen"] as const) {
  test.describe(`login scoping: ${role}`, () => {
    test.skip(
      !hasRoleCreds[role],
      `requires TEST_${role.toUpperCase()}_EMAIL/TEST_${role.toUpperCase()}_PASSWORD in .env.test`
    );

    test(`signs in and lands on /${role}, not another role's dashboard`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(new RegExp(`/${role}$`));
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    });

    test(`is redirected away from other roles' dashboards after signing in`, async ({ page }) => {
      await loginAs(page, role);
      const otherRoles = (Object.keys(DASHBOARDS) as (keyof typeof DASHBOARDS)[]).filter(
        (r) => r !== role
      );
      for (const other of otherRoles) {
        await page.goto(DASHBOARDS[other].path);
        await expect(page).toHaveURL(/\/login/);
        expect(new URL(page.url()).searchParams.get("error")).toBe("not_authorized");
      }
    });

    test("visiting a staff route while signed out redirects to /login with a return path", async ({
      page,
    }) => {
      await page.goto(DASHBOARDS[role].path);
      await expect(page).toHaveURL(/\/login/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(DASHBOARDS[role].path);
    });
  });
}

test.describe("login form security behavior", () => {
  test("shows a generic error for a wrong password without confirming whether the email exists", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/^Email$/).fill("definitely-not-a-real-account@example.com");
    await page.getByLabel(/^Password$/).fill("wrong-password");
    await page.getByRole("button", { name: /Sign in/ }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("locks out the form after 5 failed attempts", async ({ page }) => {
    await page.goto("/login");
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/^Email$/).fill("definitely-not-a-real-account@example.com");
      await page.getByLabel(/^Password$/).fill(`wrong-password-${i}`);
      await page.getByRole("button", { name: /Sign in/ }).click();
      await expect(page.getByText("Invalid email or password.")).toBeVisible();
    }
    await expect(page.getByText(/Too many attempts/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/ })).toBeDisabled();
  });
});
