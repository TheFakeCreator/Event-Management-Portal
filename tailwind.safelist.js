// tailwind.safelist.js
// This file contains classes that should never be purged from your CSS
export const safelist = [
  // Dark mode background classes
  "dark:bg-dark-bg",
  "dark:bg-dark-surface",
  "dark:bg-dark-card",

  // Dark mode text classes
  "dark:text-dark-text-primary",
  "dark:text-dark-text-secondary",
  "dark:text-dark-text-muted",
  "dark:text-primary-400",
  "dark:text-primary-500",
  "dark:text-primary-600",

  // Dark mode border classes
  "dark:border-dark-border",
  "dark:border-primary-400",
  "dark:border-primary-500",

  // Hover states for dark mode
  "dark:hover:bg-primary-500",
  "dark:hover:bg-primary-600",
  "dark:hover:bg-slate-600",
  "dark:hover:bg-dark-card",
  "dark:hover:text-primary-400",

  // Focus states for dark mode
  "dark:focus:ring-primary-500",

  // Icon visibility classes for theme toggle
  "dark:block",
  "dark:hidden",
];
