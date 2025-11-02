import { expect, test } from "@playwright/test";
import { login } from "./helpers/login";

test.describe("Dashboard", () => {
  test("admin dashboard should show system overview", async ({ page }) => {
    // Login as admin
    await login(page, "admin@example.com", "password123");

    // Check personal activity section
    await expect(page.locator('h2:has-text("Your Activity")')).toBeVisible();
    await expect(page.locator('dt:has-text("Login Count (30 days)")')).toBeVisible();
    await expect(page.locator('dt:has-text("Last Login")')).toBeVisible();
    await expect(page.locator('dt:has-text("Account Status")')).toBeVisible();

    // Check system overview section (admin only)
    await expect(page.locator('h2:has-text("System Overview")')).toBeVisible();
    await expect(page.locator('dt:has-text("Total Users")')).toBeVisible();
    await expect(page.locator('dt:has-text("Active Sessions")')).toBeVisible();
    await expect(page.locator('dt:has-text("Total Roles")')).toBeVisible();

    // Check administration section
    await expect(page.locator('h2:has-text("Administration")')).toBeVisible();
  });

  test("regular user dashboard should not show system overview", async ({ page }) => {
    // Login as regular user
    await login(page, "user@example.com", "password123");

    // Check personal activity section is visible
    await expect(page.locator('h2:has-text("Your Activity")')).toBeVisible();
    await expect(page.locator('dt:has-text("Login Count (30 days)")')).toBeVisible();
    await expect(page.locator('dt:has-text("Last Login")')).toBeVisible();
    await expect(page.locator('dt:has-text("Account Status")')).toBeVisible();

    // Check system overview section is NOT visible
    await expect(page.locator('h2:has-text("System Overview")')).not.toBeVisible();
    await expect(page.locator('dt:has-text("Total Users")')).not.toBeVisible();
    await expect(page.locator('dt:has-text("Active Sessions")')).not.toBeVisible();
    await expect(page.locator('dt:has-text("Total Roles")')).not.toBeVisible();

    // Check administration section is NOT visible
    await expect(page.locator('h2:has-text("Administration")')).not.toBeVisible();

    // But quick actions should be visible
    await expect(page.locator('h2:has-text("Quick Actions")')).toBeVisible();
  });

  test("welcome message should display user info", async ({ page }) => {
    // Login as admin
    await login(page, "admin@example.com", "password123");

    // Check welcome message
    await expect(page.locator('h3:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('text="You\'re logged in as admin@example.com"')).toBeVisible();
    await expect(page.getByText("Your roles:")).toBeVisible();
  });
});
