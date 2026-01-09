import { Router } from "express";
import whitelistRoutes from "../whitelist.routes.js";
import quizRoutes from "../quiz.routes.js";

const router = Router();

/**
 * Mount API route modules
 */
router.use("/whitelist", whitelistRoutes);
router.use("/quizzes", quizRoutes);

export default router;
