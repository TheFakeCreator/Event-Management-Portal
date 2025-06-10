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
import "./jobs/eventReminder.js";

// Middleware Imports
import errorHandler from "./middlewares/errorHandler.js";

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
app.use(cors());
app.engine("ejs", ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: false, // Change this to true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

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
