import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index", { title: "Event Management Portal" });
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

export default router;
