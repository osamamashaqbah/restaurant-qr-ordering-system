import { describe, it, expect } from "vitest";
import { getRequiredRoleForPath } from "./proxy";

describe("getRequiredRoleForPath (route -> required-role mapping used by proxy.ts)", () => {
  it("maps /admin routes to the admin role", () => {
    expect(getRequiredRoleForPath("/admin")).toBe("admin");
    expect(getRequiredRoleForPath("/admin/staff")).toBe("admin");
  });

  it("maps /cashier routes to the cashier role", () => {
    expect(getRequiredRoleForPath("/cashier")).toBe("cashier");
  });

  it("maps /kitchen routes to the kitchen role", () => {
    expect(getRequiredRoleForPath("/kitchen")).toBe("kitchen");
  });

  it("returns undefined for public/customer routes", () => {
    expect(getRequiredRoleForPath("/")).toBeUndefined();
    expect(getRequiredRoleForPath("/menu")).toBeUndefined();
    expect(getRequiredRoleForPath("/cart")).toBeUndefined();
    expect(getRequiredRoleForPath("/login")).toBeUndefined();
  });

  it("does not false-positive on a path that merely contains a role word", () => {
    expect(getRequiredRoleForPath("/administrative-notice")).toBeUndefined();
    expect(getRequiredRoleForPath("/cashierly")).toBeUndefined();
  });
});
