import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Event router");
});

export default router;
