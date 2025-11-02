import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");

  // Wait for the form to be ready
  await page.waitForSelector("form");
  await page.waitForLoadState("networkidle");

  // Clear fields before typing (in case of autofill)
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.clear();
  await emailInput.fill(email);

  await passwordInput.clear();
  await passwordInput.fill(password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/dashboard\/?/, { timeout: 10000 });
}
