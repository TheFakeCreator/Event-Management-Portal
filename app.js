// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Validate environment variables for security
import { validateEnvironment } from "./utils/envValidator.js";
validateEnvironment();

// DB Import
import db from "./configs/mongoose-connect.js";

// Package Imports
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import expressSession from "express-session";
import flash from "connect-flash";
import ejsMate from "ejs-mate";
import "./configs/passport.js";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import "./jobs/eventReminder.js";

// Middleware Imports
import errorHandler from "./middlewares/errorHandler.js";
import { addXSSHelpers } from "./utils/xssProtection.js";
import { generateCSRF, validateCSRF } from "./middlewares/csrfMiddleware.js";

// Router Imports
import indexRouter from "./routes/index.routes.js";
import adminRouter from "./routes/admin.routes.js";
import eventRouter from "./routes/event.routes.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import clubRouter from "./routes/club.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import recruitmentRouter from "./routes/recruitment.routes.js";
import announcementRouter from "./routes/announcement.routes.js";
dotenv.config();

// App constants
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
// Security headers with Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http:",
          "https://res.cloudinary.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.cloudinary.com",
          "https://res.cloudinary.com",
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for file uploads
  })
);

// Secure CORS configuration
const corsOptions = {
  origin: [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

app.use(cors(corsOptions));
app.engine("ejs", ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Change default session name for security
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 1000 * 60 * 60, // 1 hour (reduced from 24 hours)
      sameSite: "strict", // CSRF protection
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// CSRF Protection
app.use(generateCSRF);

// Add XSS protection helpers to all responses
app.use(addXSSHelpers);

// Sets
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Routes
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/event", eventRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/club", clubRouter);
app.use("/recruitment", recruitmentRouter);
app.use("/announcements", announcementRouter);
app.use("/api", uploadRoutes);
app.use("/announcements", announcementRouter);
app.use("/api/events", eventRouter);

// Centralized error handler (must be after all routes)
app.use(errorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app;
