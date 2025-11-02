export type Theme = "light" | "dark" | "system";

export function getThemeFromStorage(): Theme {
  if (typeof window === "undefined") return "system";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function setThemeToStorage(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", theme);
}

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const effectiveTheme = getEffectiveTheme(theme);

  if (effectiveTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function initializeTheme() {
  if (typeof window === "undefined") return;

  const theme = getThemeFromStorage();
  // Set default theme to localStorage if not set
  if (!localStorage.getItem("theme")) {
    setThemeToStorage("system");
  }
  applyTheme(theme);

  // Listen for system theme changes if using system theme
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      applyTheme("system");
    });
  }
}
