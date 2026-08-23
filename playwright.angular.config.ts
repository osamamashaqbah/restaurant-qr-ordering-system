import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  testDir: "./e2e-angular",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4200",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "dotnet run --project backend/RestaurantQrOrdering.Api --no-launch-profile --urls http://localhost:5239",
          url: "http://localhost:5239/api/health",
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: "npm --prefix frontend start -- --host localhost",
          url: "http://localhost:4200",
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],
});
