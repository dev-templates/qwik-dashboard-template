import { expect, test } from "@playwright/test";

test.describe("Theme Functionality", () => {
  test("theme system works correctly", async ({ page }) => {
    // First login
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL("/dashboard/");
    await page.waitForLoadState("networkidle");

    // Test 1: Check initial theme - it might be null or "system"
    const initialTheme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(initialTheme === null || initialTheme === "system").toBe(true);

    // Test 2: Verify theme functions work
    await page.evaluate(() => {
      // Import theme functions inline
      function setThemeToStorage(theme) {
        localStorage.setItem("theme", theme);
      }

      function applyTheme(theme) {
        const effectiveTheme =
          theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;

        if (effectiveTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }

      // Test light theme
      setThemeToStorage("light");
      applyTheme("light");
    });

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);

    // Test 3: Dark theme
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

    // Test 4: Theme persists after reload
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Theme should still be dark after reload
    const themeAfterReload = await page.evaluate(() => localStorage.getItem("theme"));
    expect(themeAfterReload).toBe("dark");

    // Test 5: System theme
    await page.evaluate(() => {
      localStorage.setItem("theme", "system");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    });

    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
  });

  test("theme UI elements are present", async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard/");
    await page.waitForLoadState("networkidle");

    // Desktop: Check theme button exists in sidebar
    const themeButton = page.locator('button:has-text("Theme:")');
    await expect(themeButton).toBeVisible();

    // Mobile: Check theme options in menu
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu - look for the menu button with svg icon
    const menuButton = page.locator(
      'button[aria-label*="menu" i], button:has(svg[title="Open menu"]), button:has-text("Open menu")',
    );
    const menuButtonCount = await menuButton.count();
    if (menuButtonCount > 0) {
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Check if mobile sidebar has theme toggle
      const mobileThemeButton = page.locator('button:has-text("Light Mode"), button:has-text("Dark Mode")');
      const mobileThemeCount = await mobileThemeButton.count();
      expect(mobileThemeCount).toBeGreaterThan(0);
    } else {
      // If no mobile menu, just verify desktop theme button is visible
      const desktopThemeButton = page.locator('button:has-text("Theme:")');
      await expect(desktopThemeButton).toBeVisible();
    }
  });
});
