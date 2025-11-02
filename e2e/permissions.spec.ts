import { expect, test } from "@playwright/test";
import { login } from "./helpers/login";

test.describe("Permission-based Access", () => {
  test("admin should see administration menu items", async ({ page }) => {
    // Login as admin
    await login(page, "admin@example.com", "password123");

    // Check admin menu items are visible in sidebar
    const sidebar = page.locator("nav").first();
    await expect(sidebar.locator('h3:has-text("Administration")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Users")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Roles & Permissions")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("System Settings")')).toBeVisible();

    // Check personal menu items are also visible
    await expect(sidebar.locator('h3:has-text("Personal")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Profile")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Security")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Reports")')).toBeVisible();
  });

  test("regular user should not see administration menu items", async ({ page }) => {
    // Login as regular user
    await login(page, "user@example.com", "password123");

    // Check admin menu items are NOT visible in sidebar
    const sidebar = page.locator("nav").first();
    await expect(sidebar.locator('h3:has-text("Administration")')).not.toBeVisible();
    await expect(sidebar.locator('a:has-text("Users")')).not.toBeVisible();
    await expect(sidebar.locator('a:has-text("Roles & Permissions")')).not.toBeVisible();

    // Check personal menu items ARE visible
    await expect(sidebar.locator('h3:has-text("Personal")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Profile")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Security")')).toBeVisible();
    await expect(sidebar.locator('a:has-text("Reports")')).toBeVisible();
  });

  test("admin dashboard should show administration section", async ({ page }) => {
    // Login as admin
    await login(page, "admin@example.com", "password123");

    // Check administration section is visible
    await expect(page.locator('h2:has-text("Administration")')).toBeVisible();
    await expect(page.locator('h3:has-text("Manage Users")')).toBeVisible();
    await expect(page.locator('h3:has-text("Manage Roles")')).toBeVisible();
    await expect(page.locator('h3:has-text("System Settings")')).toBeVisible();
  });

  test("regular user dashboard should not show administration section", async ({ page }) => {
    // Login as regular user
    await login(page, "user@example.com", "password123");

    // Check administration section is NOT visible
    await expect(page.locator('h2:has-text("Administration")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Manage Users")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Manage Roles")')).not.toBeVisible();

    // But quick actions should still be visible
    await expect(page.locator('h2:has-text("Quick Actions")')).toBeVisible();
  });

  test("direct access to admin pages should be blocked for regular users", async ({ page }) => {
    // Login as regular user
    await login(page, "user@example.com", "password123");

    // Try to access users page directly
    await page.goto("/dashboard/users");

    // Should be redirected or show access denied
    // The exact behavior depends on how the middleware handles unauthorized access
    const url = page.url();
    expect(url).not.toContain("/dashboard/users");
  });

  test("all users can access personal pages", async ({ page }) => {
    // Login as regular user
    await login(page, "user@example.com", "password123");

    // Navigate to profile page
    await page.click('a:has-text("Profile")');
    await page.waitForURL(/\/dashboard\/profile\/?/);
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();

    // Navigate to security page
    await page.click('a:has-text("Security")');
    await page.waitForURL(/\/dashboard\/security\/?/);
    await expect(page.locator('h1:has-text("Security Settings")')).toBeVisible();

    // Navigate to reports page
    await page.click('a:has-text("Reports")');
    await page.waitForURL(/\/dashboard\/reports\/?/);
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
  });
});
