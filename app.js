import db from "./configs/mongoose-connect.js";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import expressSession from "express-session";
import passport from "passport";
import flash from "connect-flash";
import ejsMate from "ejs-mate";
import indexRouter from "./routes/index.routes.js";
import eventRouter from "./routes/event.routes.js";
dotenv.config();
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.engine("ejs", ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "mySecret", // We have to change it later
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/event", eventRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
