// Theme management system
class ThemeManager {
  constructor() {
    console.log("ThemeManager initialized");
    this.init();
  }

  init() {
    // Load theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    console.log("Saved theme:", savedTheme);
    console.log("System prefers dark:", systemPrefersDark);

    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (systemPrefersDark) {
      this.setTheme("dark");
    } else {
      this.setTheme("light");
    }

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        console.log("System theme changed:", e.matches ? "dark" : "light");
        if (!localStorage.getItem("theme")) {
          this.setTheme(e.matches ? "dark" : "light");
        }
      });
  }
  setTheme(theme) {
    console.log("Setting theme to:", theme);
    const html = document.documentElement;
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");
    const mobileSunIcon = document.getElementById("mobile-sun-icon");
    const mobileMoonIcon = document.getElementById("mobile-moon-icon");

    console.log("HTML element:", html);
    console.log("Current HTML classes:", html.className);

    if (theme === "dark") {
      html.className = "dark";
      console.log("Added 'dark' class. New classes:", html.className);
      if (sunIcon) {
        sunIcon.classList.remove("hidden");
        console.log("Showing sun icon");
      }
      if (moonIcon) {
        moonIcon.classList.add("hidden");
        console.log("Hiding moon icon");
      }
      if (mobileSunIcon) mobileSunIcon.classList.remove("hidden");
      if (mobileMoonIcon) mobileMoonIcon.classList.add("hidden");
    } else {
      html.className = "";
      console.log("Removed 'dark' class. New classes:", html.className);
      if (sunIcon) {
        sunIcon.classList.add("hidden");
        console.log("Hiding sun icon");
      }
      if (moonIcon) {
        moonIcon.classList.remove("hidden");
        console.log("Showing moon icon");
      }
      if (mobileSunIcon) mobileSunIcon.classList.add("hidden");
      if (mobileMoonIcon) mobileMoonIcon.classList.remove("hidden");
    }

    localStorage.setItem("theme", theme);
    this.currentTheme = theme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
  }

  getCurrentTheme() {
    return this.currentTheme || "light";
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing theme manager");
  const themeManager = new ThemeManager();

  // Set up theme toggle button
  const themeToggle = document.getElementById("theme-toggle");
  const mobileThemeToggle = document.getElementById("mobile-theme-toggle");

  console.log("Theme toggle button found:", themeToggle ? "Yes" : "No");
  console.log(
    "Mobile theme toggle button found:",
    mobileThemeToggle ? "Yes" : "No"
  );

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      console.log("Theme toggle button clicked");
      themeManager.toggleTheme();
    });
  }

  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      console.log("Mobile theme toggle button clicked");
      themeManager.toggleTheme();
    });
  }

  // Make theme manager globally available
  window.themeManager = themeManager;
});

// Initialize theme immediately to prevent flash
(function () {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.className = "dark";
  }
})();
