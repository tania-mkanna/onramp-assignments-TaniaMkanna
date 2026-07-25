import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest.js";
import { askController } from "../controllers/ragController.js";

const router = Router();

const AskSchema = z.object({
  topic: z.enum(["books", "quotes", "other"]),
  question: z.string().min(3, "Question must be at least 3 characters"),
});

router.post("/ask", validateBody(AskSchema), askController);

export default router;