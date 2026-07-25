import { Router } from "express";
import { TOPICS } from "../config/topics.js";

const router = Router();
router.get("/topics", (_req, res) => {
  const topics = Object.entries(TOPICS).map(([key, v]) => ({
    key, label: v.label, available: Boolean(v.domain),
  }));
  res.json({ topics });
});

export default router;