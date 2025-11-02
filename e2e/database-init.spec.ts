import { expect, test } from "@playwright/test";

test.describe("Database Initialization", () => {
  test("should load the application with initialized database", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Should redirect to login page (app is running properly)
    await expect(page).toHaveURL(/\/auth\/login/);

    // Confirm login form is visible
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("should login with default admin account", async ({ page }) => {
    await page.goto("/auth/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Fill in default admin credentials
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation - might take longer
    await page.waitForTimeout(2000);

    // Verify login succeeded - should not stay on login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("/auth/login");

    // Should redirect to dashboard or 2FA setup page
    const validDestinations = ["/dashboard", "/auth/setup-2fa", "/auth/verify-2fa"];
    const isValidDestination = validDestinations.some((dest) => currentUrl.includes(dest));
    expect(isValidDestination).toBeTruthy();
  });

  test("should login with default editor account", async ({ page }) => {
    await page.goto("/auth/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Fill in default editor credentials
    await page.fill('input[type="email"]', "editor@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify login succeeded - should not stay on login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("/auth/login");

    // Should redirect to dashboard or 2FA setup page
    const validDestinations = ["/dashboard", "/auth/setup-2fa", "/auth/verify-2fa"];
    const isValidDestination = validDestinations.some((dest) => currentUrl.includes(dest));
    expect(isValidDestination).toBeTruthy();
  });

  test("should login with default regular user account", async ({ page }) => {
    await page.goto("/auth/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Fill in default regular user credentials
    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify login succeeded - should not stay on login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("/auth/login");

    // Should redirect to dashboard or 2FA setup page
    const validDestinations = ["/dashboard", "/auth/setup-2fa", "/auth/verify-2fa"];
    const isValidDestination = validDestinations.some((dest) => currentUrl.includes(dest));
    expect(isValidDestination).toBeTruthy();
  });

  test("should not allow login with incorrect credentials", async ({ page }) => {
    await page.goto("/auth/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Fill in incorrect credentials
    await page.fill('input[type="email"]', "nonexistent@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait a moment to ensure form submission completes
    await page.waitForTimeout(1000);

    // Verify still on login page (login failed)
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
