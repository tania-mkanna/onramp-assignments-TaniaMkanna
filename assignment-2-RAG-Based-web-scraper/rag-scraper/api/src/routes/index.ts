import { Router } from "express";
import topicRoutes from "./topicRoutes.js";
import ragRoutes from "./ragRoutes.js";
import pageRoutes from "./pageRoutes.js";
import searchRoutes from "./searchRoutes.js";

const router = Router();
router.use("/", topicRoutes);
router.use("/", ragRoutes);
router.use("/", pageRoutes);
router.use("/", searchRoutes);

export default router;