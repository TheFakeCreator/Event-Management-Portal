/**
 * Input Guidance and Placeholder Text
 * Provides user-friendly guidance for form inputs
 */

/**
 * Input placeholders, examples, and help text for user guidance
 */
export const inputGuidance = {
  // Authentication inputs
  auth: {
    name: {
      placeholder: "Enter your full name",
      example: "John Doe",
      helpText: "Your real name as you'd like it to appear on your profile",
      pattern: "Letters, spaces, hyphens, and apostrophes only",
    },
    username: {
      placeholder: "Choose a unique username",
      example: "johndoe123",
      helpText: "3-30 characters, letters and numbers only",
      pattern: "Letters and numbers only, 3-30 characters",
    },
    email: {
      placeholder: "Enter your email address",
      example: "user@example.com",
      helpText: "We'll use this for login and important notifications",
      pattern: "Valid email address format",
    },
    password: {
      placeholder: "Create a strong password",
      example: "MySecure123!",
      helpText:
        "At least 8 characters with uppercase, lowercase, number, and special character",
      pattern: "Min 8 chars: A-Z, a-z, 0-9, @$!%*?&",
    },
    confirmPassword: {
      placeholder: "Confirm your password",
      example: "MySecure123!",
      helpText: "Re-enter the same password",
      pattern: "Must match the password above",
    },
  },

  // User profile inputs
  profile: {
    phone: {
      placeholder: "Enter your phone number",
      example: "+1234567890 or 9876543210",
      helpText: "Include country code if international",
      pattern: "Valid phone number format",
    },
    bio: {
      placeholder: "Tell us about yourself...",
      example:
        "Computer Science student passionate about web development and open source projects.",
      helpText: "Brief description about yourself (max 500 characters)",
      pattern: "Plain text only, no HTML tags",
    },
    occupation: {
      placeholder: "Your current role or profession",
      example: "Software Developer, Student, Designer",
      helpText: "What you do professionally or academically",
      pattern: "Plain text, max 255 characters",
    },
    location: {
      placeholder: "Your city or location",
      example: "New York, NY or Mumbai, India",
      helpText: "Where you're based",
      pattern: "Plain text, max 255 characters",
    },
    linkedin: {
      placeholder: "LinkedIn profile URL",
      example: "https://linkedin.com/in/username",
      helpText: "Your LinkedIn profile link",
      pattern: "Valid URL starting with http:// or https://",
    },
    github: {
      placeholder: "GitHub profile URL",
      example: "https://github.com/username",
      helpText: "Your GitHub profile link",
      pattern: "Valid URL starting with http:// or https://",
    },
    behance: {
      placeholder: "Behance portfolio URL",
      example: "https://behance.net/username",
      helpText: "Your Behance portfolio link",
      pattern: "Valid URL starting with http:// or https://",
    },
  },

  // Event inputs
  event: {
    title: {
      placeholder: "Enter event title",
      example: "Web Development Workshop 2024",
      helpText: "A clear, descriptive title for your event",
      pattern: "3-255 characters, no HTML tags",
    },
    description: {
      placeholder: "Describe your event...",
      example:
        "Join us for an intensive workshop covering modern web development technologies including React, Node.js, and MongoDB.",
      helpText: "Detailed description of what attendees can expect",
      pattern: "Min 10 characters, plain text only",
    },
    location: {
      placeholder: "Event venue or location",
      example: "Main Auditorium, Building A or Online via Zoom",
      helpText: "Where the event will take place",
      pattern: "Plain text, max 255 characters",
    },
    startDate: {
      placeholder: "YYYY-MM-DD",
      example: "2024-12-25",
      helpText: "When the event starts",
      pattern: "Date format: YYYY-MM-DD",
    },
    endDate: {
      placeholder: "YYYY-MM-DD",
      example: "2024-12-25",
      helpText: "When the event ends (must be same day or later)",
      pattern: "Date format: YYYY-MM-DD",
    },
    startTime: {
      placeholder: "HH:MM",
      example: "14:30 or 09:00",
      helpText: "Start time in 24-hour format",
      pattern: "Time format: HH:MM (24-hour)",
    },
    endTime: {
      placeholder: "HH:MM",
      example: "16:30 or 17:00",
      helpText: "End time in 24-hour format",
      pattern: "Time format: HH:MM (24-hour)",
    },
    image: {
      placeholder: "Event poster/banner URL",
      example: "https://example.com/event-poster.jpg",
      helpText: "Link to your event poster or banner image",
      pattern: "Valid image URL",
    },
    reportReason: {
      placeholder: "Select a reason for reporting",
      helpText: "Why are you reporting this event?",
      options: [
        { value: "inappropriate_content", label: "Inappropriate Content" },
        { value: "misleading_information", label: "Misleading Information" },
        {
          value: "unauthorized_collaboration",
          label: "Unauthorized Collaboration",
        },
        { value: "spam", label: "Spam" },
        { value: "other", label: "Other" },
      ],
    },
    reportDescription: {
      placeholder: "Provide details about the issue...",
      example:
        "This event contains inappropriate content that violates community guidelines.",
      helpText: "Please explain the issue in detail (10-1000 characters)",
      pattern: "Min 10 characters, max 1000 characters",
    },
  },

  // Club inputs
  club: {
    name: {
      placeholder: "Club name",
      example: "Computer Science Society",
      helpText: "Official name of your club or organization",
      pattern: "2-255 characters, no HTML tags",
    },
    description: {
      placeholder: "Brief description of your club...",
      example:
        "A community of students passionate about computer science, programming, and technology innovation.",
      helpText: "Short description of what your club does",
      pattern: "Min 10 characters, plain text only",
    },
    about: {
      placeholder: "Detailed information about your club...",
      example:
        "Founded in 2020, our club organizes workshops, hackathons, and networking events. We welcome students from all backgrounds interested in technology.",
      helpText:
        "Comprehensive information about your club's mission, activities, and goals",
      pattern: "Plain text only, no HTML tags",
    },
    socialEmail: {
      placeholder: "Club contact email",
      example: "contact@csclub.edu",
      helpText: "Official email for club communications",
      pattern: "Valid email address",
    },
    instagram: {
      placeholder: "Instagram profile URL",
      example: "https://instagram.com/csclub",
      helpText: "Your club's Instagram page",
      pattern: "Valid Instagram URL",
    },
    facebook: {
      placeholder: "Facebook page URL",
      example: "https://facebook.com/csclub",
      helpText: "Your club's Facebook page",
      pattern: "Valid Facebook URL",
    },
    discord: {
      placeholder: "Discord server invite URL",
      example: "https://discord.gg/invite-code",
      helpText: "Invite link to your club's Discord server",
      pattern: "Valid Discord invite URL",
    },
    sponsors: {
      name: {
        placeholder: "Sponsor company name",
        example: "Tech Corp Inc.",
        helpText: "Name of the sponsoring organization",
        pattern: "Plain text, max 255 characters",
      },
      website: {
        placeholder: "Sponsor website URL",
        example: "https://techcorp.com",
        helpText: "Official website of the sponsor",
        pattern: "Valid URL",
      },
      description: {
        placeholder: "Brief description of sponsor...",
        example:
          "Leading technology company specializing in web development solutions.",
        helpText: "Optional description of the sponsor",
        pattern: "Plain text only",
      },
    },
  },

  // Recruitment inputs
  recruitment: {
    title: {
      placeholder: "Recruitment title",
      example: "Web Development Team - Spring 2024",
      helpText: "Clear title for the recruitment drive",
      pattern: "3-255 characters, no HTML tags",
    },
    description: {
      placeholder: "Describe the role and requirements...",
      example:
        "We're looking for passionate web developers to join our team. Experience with React and Node.js preferred but not required.",
      helpText: "Detailed description of the position and requirements",
      pattern: "Min 10 characters, plain text only",
    },
    deadline: {
      placeholder: "YYYY-MM-DD",
      example: "2024-12-31",
      helpText: "Last date for applications",
      pattern: "Date format: YYYY-MM-DD (must be in the future)",
    },
    applicationForm: {
      label: {
        placeholder: "Question or field label",
        example: "Why do you want to join our team?",
        helpText: "The question or prompt for applicants",
        pattern: "Plain text, max 255 characters",
      },
    },
  },

  // Announcement inputs
  announcement: {
    title: {
      placeholder: "Announcement title",
      example: "Important: Event Schedule Changes",
      helpText: "Clear, attention-grabbing title",
      pattern: "3-200 characters, no HTML tags",
    },
    content: {
      placeholder: "Write your announcement...",
      example:
        "Due to unforeseen circumstances, the workshop scheduled for tomorrow has been moved to next week. All registered participants will be notified via email.",
      helpText: "Detailed announcement content",
      pattern: "10-5000 characters, plain text only",
    },
    priority: {
      placeholder: "Select priority level",
      helpText: "How urgent is this announcement?",
      options: [
        { value: "low", label: "Low Priority" },
        { value: "medium", label: "Medium Priority" },
        { value: "high", label: "High Priority" },
        { value: "urgent", label: "Urgent" },
      ],
    },
    targetAudience: {
      placeholder: "Select target audience",
      helpText: "Who should see this announcement?",
      options: [
        { value: "all", label: "Everyone" },
        { value: "students", label: "Students Only" },
        { value: "moderators", label: "Moderators Only" },
        { value: "admins", label: "Admins Only" },
      ],
    },
  },

  // Search and filter inputs
  search: {
    query: {
      placeholder: "Search events, clubs, or people...",
      example: "web development workshop",
      helpText: "Enter keywords to search",
      pattern: "Max 100 characters",
    },
    page: {
      placeholder: "Page number",
      example: "1",
      helpText: "Page number for pagination",
      pattern: "Number between 1 and 1000",
    },
    limit: {
      placeholder: "Items per page",
      example: "10",
      helpText: "Number of items to show per page",
      pattern: "Number between 1 and 100",
    },
  },

  // File upload guidance
  files: {
    image: {
      helpText: "Upload an image file (JPEG, PNG, GIF, WebP)",
      maxSize: "Maximum file size: 5MB",
      allowedTypes: "Allowed formats: .jpg, .jpeg, .png, .gif, .webp",
      recommendations:
        "For best results, use high-quality images with good lighting",
    },
    document: {
      helpText: "Upload a document file (PDF, DOC, DOCX)",
      maxSize: "Maximum file size: 10MB",
      allowedTypes: "Allowed formats: .pdf, .doc, .docx",
      recommendations:
        "Ensure your document is properly formatted and readable",
    },
  },
};

/**
 * Get guidance for a specific input field
 * @param {string} category - Category of input (auth, profile, event, etc.)
 * @param {string} field - Specific field name
 * @returns {Object} Guidance object with placeholder, example, helpText, pattern
 */
export const getInputGuidance = (category, field) => {
  return (
    inputGuidance[category]?.[field] || {
      placeholder: "Enter value",
      helpText: "Please enter a valid value",
      pattern: "Follow the required format",
    }
  );
};

/**
 * Common validation error messages that are user-friendly
 */
export const userFriendlyErrors = {
  required: "This field is required",
  email: "Please enter a valid email address (e.g., user@example.com)",
  minLength: (min) => `Must be at least ${min} characters long`,
  maxLength: (max) => `Must not exceed ${max} characters`,
  pattern: "Please follow the required format",
  passwordMismatch: "Passwords do not match",
  invalidDate: "Please enter a valid date in YYYY-MM-DD format",
  invalidTime: "Please enter a valid time in HH:MM format (24-hour)",
  invalidUrl: "Please enter a valid URL starting with http:// or https://",
  invalidPhone: "Please enter a valid phone number",
  noHtmlTags: "HTML tags and scripts are not allowed for security reasons",
  fileTooBig: (maxSize) => `File size must not exceed ${maxSize}`,
  invalidFileType: (allowedTypes) =>
    `Only these file types are allowed: ${allowedTypes.join(", ")}`,
  futureDate: "Date must be in the future",
  pastDate: "Date must be in the past",
  mongoId: "Invalid ID format",
  alphanumeric: "Only letters and numbers are allowed",
  lettersOnly: "Only letters, spaces, hyphens, and apostrophes are allowed",
};

export default {
  inputGuidance,
  getInputGuidance,
  userFriendlyErrors,
};
