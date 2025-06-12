/**
 * Page Utilities
 * Small utility functions for page functionality
 */

document.addEventListener("DOMContentLoaded", function () {
  // Set current year in copyright
  const yearElements = document.querySelectorAll(".current-year");
  const currentYear = new Date().getFullYear();

  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });

  // You can add other small utility functions here
});
