// DB Import
import db from "./configs/mongoose-connect.js";

// Package Imports
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import expressSession from "express-session";
import flash from "connect-flash";
import ejsMate from "ejs-mate";
import passport from "./configs/passport.js";

// Router Imports
import indexRouter from "./routes/index.routes.js";
import eventRouter from "./routes/event.routes.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";

dotenv.config();

// App constants
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
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
app.use("/event", eventRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
