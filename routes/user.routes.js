import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("user", { title: "Event Management Portal" });
});

export default router;
