import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticatedLineant, (req, res) => {
  res.render("index", {
    title: "Event Management Portal",
    isAuthenticated: req.isAuthenticated,
  });
});

export default router;
