// Landing Page JavaScript

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

// Feature Cards Cycling Animation
// Optimized for performance using JavaScript Web Animations API instead of CSS
// Benefits: Better control, smoother animations, no layout thrashing, cross-browser compatibility
class FeatureCycler {
  constructor() {
    this.features = [
      {
        icon: "📅",
        title: "Event Management",
        description:
          "Create, manage, and organize events with powerful tools and real-time tracking capabilities.",
      },
      {
        icon: "👥",
        title: "Participant Tracking",
        description:
          "Track participants, manage registrations, and monitor engagement throughout your events.",
      },
      {
        icon: "🏆",
        title: "Leaderboards & Analytics",
        description:
          "View performance metrics, generate leaderboards, and gain insights with detailed analytics.",
      },
      {
        icon: "🎯",
        title: "Club Management",
        description:
          "Organize and manage clubs, assign roles, and coordinate group activities effectively.",
      },
      {
        icon: "🏅",
        title: "Winners & Awards",
        description:
          "Track winners, distribute awards, and celebrate achievements with automated recognition systems.",
      },
      {
        icon: "👤",
        title: "Member Management",
        description:
          "Manage member profiles, track participation, and maintain comprehensive member databases.",
      },
    ];
    this.currentSet = 0;
    this.cards = Array.from(document.querySelectorAll(".feature-card"));
    this.isAnimating = false;

    console.log("FeatureCycler: Found", this.cards.length, "feature cards");
    console.log("FeatureCycler: Cards:", this.cards);

    if (this.cards.length > 0) {
      console.log("FeatureCycler: Starting hover effects and cycling");
      this.addHoverEffects();
      this.startCycling();
    } else {
      console.warn("FeatureCycler: No feature cards found!");
    }
  }
  updateCard(card, featureData) {
    const icon = card.querySelector(".feature-icon");
    const title = card.querySelector(".feature-title");
    const description = card.querySelector(".feature-description");

    if (icon) icon.textContent = featureData.icon;
    if (title) title.textContent = featureData.title;
    if (description) description.textContent = featureData.description;
  }

  async cycleFeatures() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // JavaScript-based wipe-out animation using Web Animations API
    const outAnimations = this.cards.map((card) => {
      return card.animate(
        [
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            opacity: 1,
            filter: "brightness(1) saturate(1)",
            transform: "scale(1)",
          },
          {
            clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
            opacity: 0.7,
            filter: "brightness(0.6) saturate(0.8)",
            transform: "scale(0.95)",
          },
        ],
        {
          duration: 350,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }
      );
    });

    // Wait for all out animations to complete
    await Promise.all(outAnimations.map((anim) => anim.finished));

    // Update content with next set
    this.currentSet = (this.currentSet + 3) % this.features.length;

    this.cards.forEach((card, index) => {
      const featureIndex = (this.currentSet + index) % this.features.length;
      this.updateCard(card, this.features[featureIndex]);
    });

    // JavaScript-based wipe-in animation using Web Animations API
    const inAnimations = this.cards.map((card, index) => {
      return card.animate(
        [
          {
            clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
            opacity: 0.7,
            filter: "brightness(1.2) saturate(1.1)",
            transform: "scale(1.02)",
          },
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            opacity: 1,
            filter: "brightness(1) saturate(1)",
            transform: "scale(1)",
          },
        ],
        {
          duration: 450,
          delay: index * 50, // Stagger the animations slightly
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }
      );
    });

    // Wait for all in animations to complete
    await Promise.all(inAnimations.map((anim) => anim.finished));

    this.isAnimating = false;
  }

  startCycling() {
    // Initial setup with entrance animation
    this.cards.forEach((card, index) => {
      const featureIndex = (this.currentSet + index) % this.features.length;
      this.updateCard(card, this.features[featureIndex]);

      // Add smooth entrance animation for initial load
      card.animate(
        [
          {
            opacity: 0,
            transform: "translateY(30px) scale(0.9)",
            filter: "blur(4px)",
          },
          {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
            filter: "blur(0px)",
          },
        ],
        {
          duration: 600,
          delay: index * 100, // Stagger entrance animations
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }
      );
    });

    // Start cycling every 3.5 seconds (reduced from 4 seconds for smoother experience)
    setInterval(() => {
      this.cycleFeatures();
    }, 3500);
  }

  addHoverEffects() {
    this.cards.forEach((card) => {
      let hoverAnimation = null;

      card.addEventListener("mouseenter", () => {
        // Cancel any existing hover animation
        if (hoverAnimation) {
          hoverAnimation.cancel();
        }

        hoverAnimation = card.animate(
          [
            {
              transform: "translateY(0px) scale(1)",
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
              filter: "brightness(1)",
            },
            {
              transform: "translateY(-8px) scale(1.02)",
              boxShadow: "0 25px 50px rgba(59, 130, 246, 0.6)",
              filter: "brightness(1.1)",
            },
          ],
          {
            duration: 250,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
          }
        );
      });

      card.addEventListener("mouseleave", () => {
        // Cancel any existing hover animation
        if (hoverAnimation) {
          hoverAnimation.cancel();
        }

        hoverAnimation = card.animate(
          [
            {
              transform: "translateY(-8px) scale(1.02)",
              boxShadow: "0 25px 50px rgba(59, 130, 246, 0.6)",
              filter: "brightness(1.1)",
            },
            {
              transform: "translateY(0px) scale(1)",
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
              filter: "brightness(1)",
            },
          ],
          {
            duration: 300,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
          }
        );
      });
    });
  }
}

// Dynamic Text Animation for cycling through different words
// Powered by JavaScript Web Animations API for smooth, performant text transitions
class DynamicTextAnimator {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.words = [
      "Events",
      "Clubs",
      "Participants",
      "Leaderboards",
      "Winners",
      "Members",
    ];

    this.currentIndex = 0;
    this.isAnimating = false;

    console.log("DynamicTextAnimator: Found element:", this.element);
    console.log("DynamicTextAnimator: Element ID:", elementId);

    if (this.element) {
      console.log("DynamicTextAnimator: Starting animation");
      this.startAnimation();
    } else {
      console.warn(
        "DynamicTextAnimator: Element with ID '" + elementId + "' not found!"
      );
    }
  }

  async changeText() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // JavaScript-based fade-out animation using Web Animations API
    const fadeOutAnimation = this.element.animate(
      [
        {
          opacity: 1,
          transform: "translateY(0px) scale(1)",
          filter: "blur(0px)",
        },
        {
          opacity: 0,
          transform: "translateY(-15px) scale(0.95)",
          filter: "blur(2px)",
        },
      ],
      {
        duration: 300,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );

    // Wait for fade-out animation to complete
    await fadeOutAnimation.finished;

    // Change text
    this.currentIndex = (this.currentIndex + 1) % this.words.length;
    this.element.textContent = this.words[this.currentIndex];

    // JavaScript-based fade-in animation using Web Animations API
    const fadeInAnimation = this.element.animate(
      [
        {
          opacity: 0,
          transform: "translateY(15px) scale(1.05)",
          filter: "blur(2px)",
        },
        {
          opacity: 1,
          transform: "translateY(0px) scale(1)",
          filter: "blur(0px)",
        },
      ],
      {
        duration: 350,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );

    // Wait for fade-in animation to complete
    await fadeInAnimation.finished;

    this.isAnimating = false;
  }

  startAnimation() {
    // Start cycling every 2.5 seconds
    setInterval(() => {
      this.changeText();
    }, 2500);
  }
}

// JavaScript-based Dynamic Sine Wave Animation System
class WaveAnimator {
  constructor() {
    this.waves = [];
    this.animationId = null;
    this.screenWidth = window.innerWidth;
    this.time = 0;

    // Initialize waves
    this.initWaves();

    // Handle window resize
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Start animation
    this.animate();
  }

  initWaves() {
    const waveElements = document.querySelectorAll(".wave-1, .wave-2, .wave-3");

    waveElements.forEach((waveElement, index) => {
      const className = waveElement.classList[0]; // wave-1, wave-2, or wave-3
      const pathElement = waveElement.querySelector("path");

      if (pathElement) {
        const waveConfig = this.getWaveConfig(className);

        this.waves.push({
          element: waveElement,
          pathElement: pathElement,
          className: className,
          speed: waveConfig.speed,
          frequency: waveConfig.frequency,
          amplitude: waveConfig.amplitude,
          baseY: waveConfig.baseY,
          phaseOffset: waveConfig.phaseOffset,
          points: waveConfig.points,
        });
      }
    });
  }

  getWaveConfig(className) {
    const configs = {
      "wave-1": {
        speed: 0.02, // Animation speed (radians per frame)
        frequency: 0.008, // Wave frequency (smaller = wider waves)
        amplitude: 25, // Wave height
        baseY: 60, // Base Y position
        phaseOffset: 0, // Phase offset for wave variation
        points: 200, // Number of points to generate smooth curve
      },
      "wave-2": {
        speed: 0.015, // Different speed
        frequency: 0.006, // Different frequency for variation
        amplitude: 30, // Slightly higher amplitude
        baseY: 70, // Different base position
        phaseOffset: Math.PI, // 180 degree phase offset
        points: 180,
      },
      "wave-3": {
        speed: 0.025, // Fastest animation
        frequency: 0.01, // Higher frequency (tighter waves)
        amplitude: 20, // Lower amplitude
        baseY: 50, // Lower base position
        phaseOffset: Math.PI / 2, // 90 degree phase offset
        points: 220,
      },
    };

    return configs[className] || configs["wave-1"];
  }

  generateSineWavePath(wave) {
    const { frequency, amplitude, baseY, phaseOffset, points } = wave;
    const width = this.screenWidth;

    // Calculate step size to cover full width with specified number of points
    const stepSize = width / (points - 1);

    let pathData = "";

    for (let i = 0; i < points; i++) {
      const x = i * stepSize;

      // Generate sine wave with time-based animation
      const y =
        baseY +
        amplitude *
          Math.sin(frequency * x + this.time * wave.speed + phaseOffset);

      if (i === 0) {
        pathData += `M${x},${y}`;
      } else {
        // Use smooth curve commands for better wave appearance
        const prevX = (i - 1) * stepSize;
        const prevY =
          baseY +
          amplitude *
            Math.sin(frequency * prevX + this.time * wave.speed + phaseOffset);

        // Create smooth curve using quadratic bezier
        const controlX = (prevX + x) / 2;
        const controlY = (prevY + y) / 2;

        pathData += ` Q${controlX},${controlY} ${x},${y}`;
      }
    }

    return pathData;
  }

  animate() {
    // Increment time for wave animation
    this.time++;

    // Update each wave's path
    this.waves.forEach((wave) => {
      const newPath = this.generateSineWavePath(wave);
      wave.pathElement.setAttribute("d", newPath);
    });

    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  handleResize() {
    const newScreenWidth = window.innerWidth;

    // Only update if screen width changed significantly
    if (Math.abs(newScreenWidth - this.screenWidth) > 50) {
      this.screenWidth = newScreenWidth;
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.handleResize);
  }
}

// Modern Interactive Mouse Following Blob
class MouseFollowingBlob {
  constructor() {
    this.blob = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.blobX = 0;
    this.blobY = 0;
    this.isVisible = false;
    this.isInteracting = false;
    this.lastInteractionTime = 0;
    this.particles = [];
    this.animationId = null;

    // Animation parameters
    this.smoothness = 0.08; // How smoothly the blob follows the mouse
    this.morphSpeed = 0.05;
    this.morphIntensity = 20;
    this.time = 0;

    // Interactive states
    this.states = {
      normal: {
        scale: 1,
        blur: 0,
        opacity: 0.4,
        color: "rgba(59, 130, 246, 0.3)", // Blue
      },
      hover: {
        scale: 1.5,
        blur: 2,
        opacity: 0.6,
        color: "rgba(168, 85, 247, 0.4)", // Purple
      },
      click: {
        scale: 2.2,
        blur: 4,
        opacity: 0.8,
        color: "rgba(236, 72, 153, 0.5)", // Pink
      },
      trail: {
        scale: 0.6,
        blur: 1,
        opacity: 0.2,
        color: "rgba(34, 197, 94, 0.3)", // Green
      },
    };

    this.currentState = this.states.normal;
    this.targetState = this.states.normal;

    this.init();
  }

  init() {
    this.createBlob();
    this.addEventListeners();
    this.startAnimation();
    console.log("MouseFollowingBlob: Initialized successfully");
  }

  createBlob() {
    // Create main blob element
    this.blob = document.createElement("div");
    this.blob.className = "mouse-blob";
    this.blob.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background: ${this.currentState.color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      filter: blur(0px);
      transform: translate(-50%, -50%) scale(1);
      transition: opacity 0.3s ease, transform 0.2s ease;
      box-shadow: 
        0 0 20px rgba(59, 130, 246, 0.3),
        0 0 40px rgba(59, 130, 246, 0.2),
        0 0 60px rgba(59, 130, 246, 0.1);
      backdrop-filter: blur(10px);
      mix-blend-mode: screen;
    `;

    // Create glow effect
    const glow = document.createElement("div");
    glow.className = "blob-glow";
    glow.style.cssText = `
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
      border-radius: 50%;
      animation: blob-pulse 2s ease-in-out infinite alternate;
    `;

    this.blob.appendChild(glow);
    document.body.appendChild(this.blob);

    // Add CSS animations
    this.addBlobStyles();
  }

  addBlobStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes blob-pulse {
        0% { transform: scale(1) rotate(0deg); opacity: 0.3; }
        50% { transform: scale(1.1) rotate(180deg); opacity: 0.5; }
        100% { transform: scale(1.2) rotate(360deg); opacity: 0.2; }
      }
      
      @keyframes blob-morph {
        0% { border-radius: 50% 40% 60% 30%; }
        25% { border-radius: 30% 60% 40% 70%; }
        50% { border-radius: 60% 30% 70% 40%; }
        75% { border-radius: 40% 70% 30% 60%; }
        100% { border-radius: 50% 40% 60% 30%; }
      }
      
      .mouse-blob.morphing {
        animation: blob-morph 0.8s ease-in-out;
      }
      
      .mouse-blob.interacting {
        animation: blob-morph 0.4s ease-in-out infinite;
      }
      
      .blob-particle {
        position: fixed;
        width: 4px;
        height: 4px;
        background: rgba(59, 130, 246, 0.6);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  addEventListeners() {
    // Mouse move tracking
    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (!this.isVisible) {
        this.showBlob();
      }

      this.lastInteractionTime = Date.now();
    });

    // Mouse leave detection
    document.addEventListener("mouseleave", () => {
      this.hideBlob();
    });

    // Interactive elements detection
    document.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (this.isInteractiveElement(target)) {
        this.setHoverState();
      } else {
        this.setNormalState();
      }
    });

    // Click interactions
    document.addEventListener("mousedown", () => {
      this.setClickState();
      this.createClickParticles();
    });

    document.addEventListener("mouseup", () => {
      this.setNormalState();
    });

    // Scroll detection for trail effect
    let scrollTimeout;
    document.addEventListener("scroll", () => {
      this.setTrailState();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.setNormalState();
      }, 1000);
    });
  }

  isInteractiveElement(element) {
    const interactiveSelectors = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      ".feature-card",
      ".btn",
      ".nav-link",
      ".sponsor-placeholder",
      ".contributor-card",
      '[role="button"]',
      '[tabindex]',
    ];

    return interactiveSelectors.some((selector) =>
      element.matches(selector) || element.closest(selector)
    );
  }

  setNormalState() {
    this.targetState = this.states.normal;
    this.isInteracting = false;
    this.blob.classList.remove("interacting", "morphing");
  }

  setHoverState() {
    this.targetState = this.states.hover;
    this.isInteracting = true;
    this.blob.classList.add("interacting");
  }

  setClickState() {
    this.targetState = this.states.click;
    this.isInteracting = true;
    this.blob.classList.add("morphing");
  }

  setTrailState() {
    this.targetState = this.states.trail;
    this.isInteracting = false;
    this.blob.classList.remove("interacting", "morphing");
  }

  showBlob() {
    this.isVisible = true;
    this.blobX = this.mouseX;
    this.blobY = this.mouseY;
    this.blob.style.opacity = this.currentState.opacity;
  }

  hideBlob() {
    this.isVisible = false;
    this.blob.style.opacity = "0";
  }

  createClickParticles() {
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "blob-particle";

      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 3 + Math.random() * 4;
      const size = 2 + Math.random() * 4;

      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${this.getRandomColor()};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        left: ${this.mouseX}px;
        top: ${this.mouseY}px;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px currentColor;
      `;

      document.body.appendChild(particle);

      // Animate particle
      const animation = particle.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 1,
          },
          {
            transform: `translate(${-50 + Math.cos(angle) * 100}%, ${-50 + Math.sin(angle) * 100}%) scale(0)`,
            opacity: 0,
          },
        ],
        {
          duration: 800 + Math.random() * 400,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
      );

      animation.onfinish = () => {
        particle.remove();
      };
    }
  }

  getRandomColor() {
    const colors = [
      "rgba(59, 130, 246, 0.8)", // Blue
      "rgba(168, 85, 247, 0.8)", // Purple
      "rgba(236, 72, 153, 0.8)", // Pink
      "rgba(34, 197, 94, 0.8)", // Green
      "rgba(251, 191, 36, 0.8)", // Yellow
      "rgba(239, 68, 68, 0.8)", // Red
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateBlobPosition() {
    // Smooth following with easing
    const dx = this.mouseX - this.blobX;
    const dy = this.mouseY - this.blobY;

    this.blobX += dx * this.smoothness;
    this.blobY += dy * this.smoothness;

    // Add subtle morphing based on movement
    const speed = Math.sqrt(dx * dx + dy * dy);
    const morphOffset = Math.sin(this.time * this.morphSpeed) * this.morphIntensity;

    // Interpolate between current and target state
    this.currentState = this.interpolateState(this.currentState, this.targetState, 0.1);

    // Apply position and styling
    this.blob.style.left = `${this.blobX}px`;
    this.blob.style.top = `${this.blobY}px`;
    this.blob.style.transform = `
      translate(-50%, -50%) 
      scale(${this.currentState.scale + speed * 0.01}) 
      rotate(${this.time * 0.5}deg)
    `;
    this.blob.style.background = this.currentState.color;
    this.blob.style.filter = `blur(${this.currentState.blur}px)`;
    this.blob.style.opacity = this.isVisible ? this.currentState.opacity : 0;

    // Dynamic box shadow based on state
    const shadowIntensity = this.currentState.scale;
    this.blob.style.boxShadow = `
      0 0 ${20 * shadowIntensity}px ${this.currentState.color},
      0 0 ${40 * shadowIntensity}px ${this.currentState.color.replace("0.3", "0.2")},
      0 0 ${60 * shadowIntensity}px ${this.currentState.color.replace("0.3", "0.1")}
    `;
  }

  interpolateState(current, target, factor) {
    return {
      scale: current.scale + (target.scale - current.scale) * factor,
      blur: current.blur + (target.blur - current.blur) * factor,
      opacity: current.opacity + (target.opacity - current.opacity) * factor,
      color: target.color, // Instant color change for better effect
    };
  }

  startAnimation() {
    const animate = () => {
      this.time += 1;

      if (this.isVisible) {
        this.updateBlobPosition();

        // Hide blob if mouse hasn't moved for a while
        if (Date.now() - this.lastInteractionTime > 3000) {
          this.hideBlob();
        }
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.blob) {
      this.blob.remove();
    }
    // Remove event listeners would go here if needed
    console.log("MouseFollowingBlob: Destroyed");
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing animations...");

  // Check Web Animations API support
  if (!Element.prototype.animate) {
    console.warn("Web Animations API not supported in this browser");
  }

  // Initialize feature cycler
  console.log("Initializing FeatureCycler...");
  const featureCycler = new FeatureCycler();
  console.log("FeatureCycler initialized:", featureCycler);

  // Initialize dynamic text animation
  console.log("Initializing DynamicTextAnimator...");
  const textAnimator = new DynamicTextAnimator("dynamicText");
  console.log("DynamicTextAnimator initialized:", textAnimator);
  // Initialize wave animator
  console.log("Initializing WaveAnimator...");
  const waveAnimator = new WaveAnimator();
  console.log("WaveAnimator initialized:", waveAnimator);

  // Initialize mouse following blob
  console.log("Initializing MouseFollowingBlob...");  const mouseBlob = new MouseFollowingBlob();
  console.log("MouseFollowingBlob initialized:", mouseBlob);

  // Observe all sections for scroll animations
  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section);
  });

  // Add staggered animation to feature cards
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });

  // Add staggered animation to sponsor placeholders
  const sponsorCards = document.querySelectorAll(".sponsor-placeholder");
  sponsorCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Add staggered animation to contributor cards
  const contributorCards = document.querySelectorAll(".contributor-card");
  contributorCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.3}s`;
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});
