/**
 * Client-side Form Validation with User-friendly Feedback
 * Provides real-time validation feedback for enhanced user experience
 */

document.addEventListener("DOMContentLoaded", function () {
  // Wait for other scripts to load
  setTimeout(function () {
    initFormValidation();
  }, 100);
});

function initFormValidation() {
  // Common validation patterns
  const validationPatterns = {
    name: {
      pattern: /^[a-zA-Z\s\-']{2,255}$/,
      message:
        "Name should contain only letters, spaces, hyphens, and apostrophes (2-255 characters)",
    },
    username: {
      pattern: /^[a-zA-Z0-9]{3,30}$/,
      message:
        "Username should contain only letters and numbers (3-30 characters)",
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    password: {
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]{8,}$/,
      message:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#+\\-_=)",
    },
    phone: {
      pattern: /^[\+]?[\d\s\-\(\)]{10,}$/,
      message: "Please enter a valid phone number",
    },
    url: {
      pattern: /^https?:\/\/[^\s$.?#].[^\s]*$/,
      message: "Please enter a valid URL starting with http:// or https://",
    },
  };

  // Add validation to all forms with validation class
  const forms = document.querySelectorAll(
    '.needs-validation, form[data-validate="true"]'
  );

  forms.forEach((form) => {
    // Prevent default HTML5 validation
    form.setAttribute("novalidate", true);

    // Add validation to inputs
    const inputs = form.querySelectorAll(
      "input[required], input[data-validate], textarea[required], textarea[data-validate], select[required], select[data-validate]"
    );

    inputs.forEach((input) => {
      // Add validation on blur and input events
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => clearErrors(input));

      // Add specific validation for password confirmation
      if (input.name === "confirmPassword") {
        input.addEventListener("input", () =>
          validatePasswordConfirmation(input)
        );
      }
    });

    // Validate on form submit
    form.addEventListener("submit", function (e) {
      let isValid = true;

      inputs.forEach((input) => {
        if (!validateField(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        e.stopPropagation();

        // Focus on first invalid field
        const firstError = form.querySelector(".is-invalid");
        if (firstError) {
          firstError.focus();
        }
      }
    });
  });
  function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = "";

    // Clear previous validation state
    clearErrors(field);

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "This field is required";
    }
    // Pattern validation for non-empty values
    else if (value) {
      // Check by field name first (more specific)
      if (fieldName === "name") {
        if (!validationPatterns.name.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.name.message;
        }
      } else if (fieldName === "username") {
        if (!validationPatterns.username.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.username.message;
        }
      } else if (fieldName === "password") {
        // Skip password validation if existing password validator is present
        if (document.getElementById("password-strength")) {
          console.log(
            "Skipping password validation - existing validator found"
          );
          return true;
        }

        console.log("Validating password:", value);
        console.log(
          "Pattern test result:",
          validationPatterns.password.pattern.test(value)
        );

        if (!validationPatterns.password.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.password.message;
        }
      } else if (fieldName === "confirmPassword") {
        // This will be handled by validatePasswordConfirmation
        return validatePasswordConfirmation(field);
      } else if (fieldName === "phone") {
        if (!validationPatterns.phone.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.phone.message;
        }
      }
      // Check by field type (fallback)
      else if (fieldType === "email") {
        if (!validationPatterns.email.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.email.message;
        }
      } else if (fieldType === "url") {
        if (!validationPatterns.url.pattern.test(value)) {
          isValid = false;
          errorMessage = validationPatterns.url.message;
        }
      }
      // Custom validation for specific inputs
      else if (fieldType === "date" && field.hasAttribute("min")) {
        const minDate = new Date(field.getAttribute("min"));
        const inputDate = new Date(value);
        if (inputDate < minDate) {
          isValid = false;
          errorMessage = "Date must be in the future";
        }
      }
    }

    // Apply validation state
    if (isValid) {
      field.classList.remove("is-invalid");
      field.classList.add("is-valid");
    } else {
      field.classList.remove("is-valid");
      field.classList.add("is-invalid");
      showError(field, errorMessage);
    }

    return isValid;
  }
  function validatePasswordConfirmation(confirmField) {
    const passwordField = document.querySelector('input[name="password"]');
    if (!passwordField) return true; // If no password field, skip validation

    const password = passwordField.value;
    const confirmPassword = confirmField.value;

    // Clear previous validation state
    clearErrors(confirmField);

    // Required field validation
    if (confirmField.hasAttribute("required") && !confirmPassword) {
      confirmField.classList.add("is-invalid");
      showError(confirmField, "This field is required");
      return false;
    }

    // Password match validation
    if (confirmPassword && password !== confirmPassword) {
      confirmField.classList.remove("is-valid");
      confirmField.classList.add("is-invalid");
      showError(confirmField, "Passwords do not match");
      return false;
    } else if (confirmPassword && password === confirmPassword) {
      confirmField.classList.remove("is-invalid");
      confirmField.classList.add("is-valid");
      return true;
    }

    return true;
  }

  function showError(field, message) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector(".validation-error");
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "validation-error text-red-500 text-xs mt-1";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;

    // Insert after the field (or after help text if it exists)
    const helpText = field.parentNode.querySelector(".text-gray-500");
    if (helpText) {
      helpText.parentNode.insertBefore(errorDiv, helpText.nextSibling);
    } else {
      field.parentNode.appendChild(errorDiv);
    }
  }

  function clearErrors(field) {
    const errorDiv = field.parentNode.querySelector(".validation-error");
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // Add CSS for validation states
  const style = document.createElement("style");
  style.textContent = `
        .is-valid {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
        }
        
        .is-invalid {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }
        
        .validation-error {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Dark mode styles */
        .dark .is-valid {
            border-color: #059669 !important;
            box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2) !important;
        }
        
        .dark .is-invalid {
            border-color: #dc2626 !important;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2) !important;
        }
    `;
  document.head.appendChild(style);

  // Character counters for textareas with maxlength
  const textAreas = document.querySelectorAll("textarea[maxlength]");
  textAreas.forEach((textarea) => {
    const maxLength = textarea.getAttribute("maxlength");

    // Create counter element
    const counter = document.createElement("div");
    counter.className =
      "text-xs text-gray-400 dark:text-dark-text-muted text-right mt-1";
    counter.innerHTML = `<span class="char-count">0</span>/${maxLength}`;

    // Insert counter after textarea
    textarea.parentNode.appendChild(counter);

    // Update counter on input
    textarea.addEventListener("input", function () {
      const count = this.value.length;
      const countSpan = counter.querySelector(".char-count");
      countSpan.textContent = count;

      // Change color based on usage
      if (count > maxLength * 0.9) {
        countSpan.className = "text-red-500";
      } else if (count > maxLength * 0.7) {
        countSpan.className = "text-yellow-500";
      } else {
        countSpan.className = "text-gray-400 dark:text-dark-text-muted";
      }
    });

    // Trigger initial count
    textarea.dispatchEvent(new Event("input"));
  });
  // Password strength indicator
  const passwordFields = document.querySelectorAll(
    'input[type="password"][name="password"]'
  );
  passwordFields.forEach((passwordField) => {
    // Skip if strength indicator already exists (check for both classes)
    if (
      passwordField.parentNode.querySelector(".password-strength") ||
      document.getElementById("password-strength")
    )
      return;

    const strengthIndicator = document.createElement("div");
    strengthIndicator.className = "password-strength mt-2";
    strengthIndicator.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-dark-text-secondary">Strength:</span>
                <span class="strength-label text-xs font-medium text-gray-500"></span>
            </div>
            <div class="strength-bar h-2 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                <div class="strength-fill h-full transition-all duration-300"></div>
            </div>
        `;

    passwordField.parentNode.appendChild(strengthIndicator);

    passwordField.addEventListener("input", function () {
      updatePasswordStrength(this, strengthIndicator);
    });
  });

  function updatePasswordStrength(passwordField, indicator) {
    const password = passwordField.value;
    const strengthFill = indicator.querySelector(".strength-fill");
    const strengthLabel = indicator.querySelector(".strength-label");

    let score = 0;
    let feedback = "";

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        strengthFill.className =
          "strength-fill h-full bg-red-500 transition-all duration-300";
        strengthFill.style.width = "20%";
        strengthLabel.textContent = "Very Weak";
        strengthLabel.className =
          "strength-label text-xs font-medium text-red-500";
        break;
      case 2:
        strengthFill.className =
          "strength-fill h-full bg-orange-500 transition-all duration-300";
        strengthFill.style.width = "40%";
        strengthLabel.textContent = "Weak";
        strengthLabel.className =
          "strength-label text-xs font-medium text-orange-500";
        break;
      case 3:
        strengthFill.className =
          "strength-fill h-full bg-yellow-500 transition-all duration-300";
        strengthFill.style.width = "60%";
        strengthLabel.textContent = "Fair";
        strengthLabel.className =
          "strength-label text-xs font-medium text-yellow-500";
        break;
      case 4:
        strengthFill.className =
          "strength-fill h-full bg-blue-500 transition-all duration-300";
        strengthFill.style.width = "80%";
        strengthLabel.textContent = "Good";
        strengthLabel.className =
          "strength-label text-xs font-medium text-blue-500";
        break;
      case 5:
        strengthFill.className =
          "strength-fill h-full bg-green-500 transition-all duration-300";
        strengthFill.style.width = "100%";
        strengthLabel.textContent = "Strong";
        strengthLabel.className =
          "strength-label text-xs font-medium text-green-500";
        break;
      default:
        strengthFill.style.width = "0%";
        strengthLabel.textContent = "";
    }
  }
}
