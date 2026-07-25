import { Router } from "express";
import { getRawPagesController, getProcessedPagesController } from "../controllers/pageController.js";

const router = Router();
router.get("/pages/raw", getRawPagesController);
router.get("/pages/processed", getProcessedPagesController);

export default router;