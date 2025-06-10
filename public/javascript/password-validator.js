// Password strength validator for client-side
// This provides real-time password validation feedback

function validatePasswordStrength(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !isCommonPassword(password),
    noSequential: !hasSequentialChars(password),
    noRepeated: !/(.)\1{3,}/.test(password),
  };

  const errors = [];
  if (!requirements.minLength) errors.push("At least 8 characters");
  if (!requirements.hasUppercase) errors.push("One uppercase letter");
  if (!requirements.hasLowercase) errors.push("One lowercase letter");
  if (!requirements.hasNumber) errors.push("One number");
  if (!requirements.hasSpecial) errors.push("One special character");
  if (!requirements.notCommon) errors.push("Not a common password");
  if (!requirements.noSequential) errors.push("No sequential characters");
  if (!requirements.noRepeated) errors.push("No repeated characters");

  const strength = calculateStrength(requirements);

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
    strength,
    score: Object.values(requirements).filter(Boolean).length,
  };
}

function calculateStrength(requirements) {
  const score = Object.values(requirements).filter(Boolean).length;

  if (score >= 7) return "very-strong";
  if (score >= 6) return "strong";
  if (score >= 4) return "medium";
  if (score >= 2) return "weak";
  return "very-weak";
}

function isCommonPassword(password) {
  const common = [
    "password",
    "password123",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "1234567890",
    "iloveyou",
    "sunshine",
    "princess",
    "admin123",
  ];
  return common.includes(password.toLowerCase());
}

function hasSequentialChars(password) {
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
  ];

  const lower = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      if (
        lower.includes(seq.substr(i, 4)) ||
        lower.includes(seq.substr(i, 4).split("").reverse().join(""))
      ) {
        return true;
      }
    }
  }
  return false;
}

// Real-time password validation
function setupPasswordValidation() {
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm-password");
  const strengthMeter = document.getElementById("password-strength");
  const requirementsList = document.getElementById("password-requirements");

  if (!passwordInput) return;

  passwordInput.addEventListener("input", function () {
    const password = this.value;
    const validation = validatePasswordStrength(password);

    updateStrengthMeter(validation.strength, validation.score);
    updateRequirements(validation.requirements);

    // Update input styling
    if (password.length > 0) {
      if (validation.isValid) {
        this.classList.remove("border-red-500", "border-yellow-500");
        this.classList.add("border-green-500");
      } else if (validation.score >= 4) {
        this.classList.remove("border-red-500", "border-green-500");
        this.classList.add("border-yellow-500");
      } else {
        this.classList.remove("border-green-500", "border-yellow-500");
        this.classList.add("border-red-500");
      }
    } else {
      this.classList.remove(
        "border-red-500",
        "border-yellow-500",
        "border-green-500"
      );
    }
  });

  if (confirmInput) {
    confirmInput.addEventListener("input", function () {
      const password = passwordInput.value;
      const confirm = this.value;

      if (confirm.length > 0) {
        if (password === confirm) {
          this.classList.remove("border-red-500");
          this.classList.add("border-green-500");
        } else {
          this.classList.remove("border-green-500");
          this.classList.add("border-red-500");
        }
      } else {
        this.classList.remove("border-red-500", "border-green-500");
      }
    });
  }
}

function updateStrengthMeter(strength, score) {
  const meter = document.getElementById("password-strength");
  if (!meter) return;

  const colors = {
    "very-weak": "bg-red-500",
    weak: "bg-red-400",
    medium: "bg-yellow-500",
    strong: "bg-blue-500",
    "very-strong": "bg-green-500",
  };
  const width = Math.max((score / 8) * 100, 10);

  meter.className = `h-1.5 rounded-full transition-all duration-300 ${
    colors[strength] || "bg-gray-300"
  }`;
  meter.style.width = `${width}%`;

  const label = document.getElementById("strength-label");
  if (label) {
    label.textContent = strength.replace("-", " ").toUpperCase();
    label.className = `text-sm font-medium ${
      colors[strength]?.replace("bg-", "text-") || "text-gray-500"
    }`;
  }
}

function updateRequirements(requirements) {
  // Update individual requirement elements in the grid
  const reqMap = {
    minLength: "8+",
    hasUppercase: "A-Z",
    hasLowercase: "a-z",
    hasNumber: "0-9",
    hasSpecial: "@#$",
    notCommon: "Safe",
    noSequential: "NoSeq",
    noRepeated: "NoRep",
  };

  // Find the grid container (now 4-column grid)
  const gridContainer = document.querySelector(".grid.grid-cols-4");
  if (!gridContainer) return;

  const divs = gridContainer.querySelectorAll("div");

  Object.entries(reqMap).forEach(([key, label], index) => {
    if (divs[index]) {
      const met = requirements[key];
      const span = divs[index].querySelector("span");

      // Update the indicator
      if (span) {
        span.textContent = met ? "✓" : "○";
      }

      // Update the color
      divs[index].className = `flex items-center ${
        met ? "text-green-600" : "text-gray-500"
      }`;
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", setupPasswordValidation);
