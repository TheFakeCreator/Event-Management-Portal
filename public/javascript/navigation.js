/**
 * Navigation Dropdown Management
 * Handles account dropdown and mobile menu functionality
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, setting up navigation...");

  // Mobile Menu Toggle
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Account Dropdown Functionality
  const accountBtn = document.getElementById("account-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const chevronIcon = document.getElementById("chevron-icon");

  console.log("Elements found:", {
    accountBtn: !!accountBtn,
    dropdownMenu: !!dropdownMenu,
    chevronIcon: !!chevronIcon,
  });

  if (accountBtn && dropdownMenu) {
    console.log("Setting up dropdown event listeners...");
    accountBtn.addEventListener("click", (event) => {
      console.log("🔵 Account button clicked!");
      event.preventDefault();
      event.stopPropagation();

      const isHidden = dropdownMenu.classList.contains("hidden");
      console.log("🔵 Dropdown is currently hidden:", isHidden);
      console.log("🔵 Dropdown element:", dropdownMenu);
      console.log(
        "🔵 Dropdown computed style display:",
        window.getComputedStyle(dropdownMenu).display
      );

      if (isHidden) {
        console.log("🟢 Showing dropdown...");
        dropdownMenu.classList.remove("hidden");
        dropdownMenu.style.display = "block";
        dropdownMenu.style.visibility = "visible";
        dropdownMenu.style.opacity = "1";
        accountBtn.setAttribute("aria-expanded", "true");
        if (chevronIcon) {
          chevronIcon.classList.add("rotate-180");
          console.log("🔄 Chevron rotated");
        }
        console.log(
          "🟢 Dropdown should now be visible. Classes:",
          dropdownMenu.className
        );
      } else {
        console.log("🔴 Hiding dropdown...");
        dropdownMenu.classList.add("hidden");
        dropdownMenu.style.display = "none";
        dropdownMenu.style.visibility = "hidden";
        dropdownMenu.style.opacity = "0";
        accountBtn.setAttribute("aria-expanded", "false");
        if (chevronIcon) {
          chevronIcon.classList.remove("rotate-180");
        }
      }
    }); // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (
        !accountBtn.contains(event.target) &&
        !dropdownMenu.contains(event.target)
      ) {
        console.log("🔴 Clicked outside, closing dropdown");
        dropdownMenu.classList.add("hidden");
        dropdownMenu.style.display = "none";
        dropdownMenu.style.visibility = "hidden";
        dropdownMenu.style.opacity = "0";
        accountBtn.setAttribute("aria-expanded", "false");
        if (chevronIcon) {
          chevronIcon.classList.remove("rotate-180");
        }
      }
    });

    // Close dropdown on escape key
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        !dropdownMenu.classList.contains("hidden")
      ) {
        console.log("🔴 Escape pressed, closing dropdown");
        dropdownMenu.classList.add("hidden");
        dropdownMenu.style.display = "none";
        dropdownMenu.style.visibility = "hidden";
        dropdownMenu.style.opacity = "0";
        accountBtn.setAttribute("aria-expanded", "false");
        if (chevronIcon) {
          chevronIcon.classList.remove("rotate-180");
        }
        accountBtn.focus();
      }
    });

    console.log("Dropdown event listeners set up successfully!");
  } else {
    console.error("Account button or dropdown menu not found!");
    if (!accountBtn) console.error("accountBtn element missing");
    if (!dropdownMenu) console.error("dropdownMenu element missing");
  }
});
