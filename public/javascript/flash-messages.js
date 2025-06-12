/**
 * Flash Message Management
 * Handles success and error flash message display and auto-hide functionality
 */

let timer = 20;
let interval;

function closeFlashMessage() {
  const container = document.getElementById("flash-message-container");
  if (container) container.style.display = "none";
  clearInterval(interval);
}

function animateTimer(id, countdownId) {
  let dashArray = 100.48;
  let dashOffset = 0;
  interval = setInterval(() => {
    timer--;
    if (timer < 0) {
      closeFlashMessage();
      return;
    }
    if (countdownId) {
      const countdownEl = document.getElementById(countdownId);
      if (countdownEl) {
        countdownEl.innerText = timer + "s";
      }
    }
    dashOffset = dashArray * (1 - timer / 20);
    const circle = document.getElementById(id);
    if (circle) circle.setAttribute("stroke-dashoffset", dashOffset);
  }, 1000);

  if (countdownId) {
    const countdownEl = document.getElementById(countdownId);
    if (countdownEl) {
      countdownEl.innerText = timer + "s";
    }
  }
}

// Initialize flash messages when DOM is loaded
window.addEventListener("DOMContentLoaded", function () {
  // Set up close button event listeners
  const closeButtons = document.querySelectorAll(".flash-close-btn");
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeFlashMessage);
  });

  if (document.getElementById("success-timer")) {
    animateTimer("success-timer", "success-countdown");
  } else if (document.getElementById("error-timer")) {
    animateTimer("error-timer", "error-countdown");
  }
  setTimeout(closeFlashMessage, 20000);
});

// Make closeFlashMessage globally available for onclick handlers
window.closeFlashMessage = closeFlashMessage;
