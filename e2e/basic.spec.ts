import { expect, test } from "@playwright/test";

test.describe("Basic Tests", () => {
  test("should load the application", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Check if page loads without errors
    await expect(page).not.toHaveTitle(/404/);

    // Since we redirect to login, check if we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/auth/login");

    // Check title
    await expect(page).toHaveTitle("Login - Qwik Dashboard");

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute("content");
    expect(metaDescription).toBe("Login to your Qwik Dashboard account");
  });

  test("should display logo", async ({ page }) => {
    await page.goto("/auth/login");

    // Check if logo is visible
    const logo = page.locator('img[alt="Qwik Dashboard"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/logo.svg");
  });

  test("should have accessibility features", async ({ page }) => {
    await page.goto("/auth/login");

    // Check for form labels (even if they're sr-only)
    await expect(page.locator('label:has-text("Email address")')).toBeAttached();
    await expect(page.locator('label:has-text("Password")')).toBeAttached();

    // Check for proper form structure
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Check for submit button
    const submitButton = form.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});
