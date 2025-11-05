import { Router } from "express";
import whitelistRoutes from "../whitelist.routes.js";
import questionRoutes from "../question.routes.js";
import quizRoutes from "../quiz.routes.js";

const router = Router();

/**
 * Mount API route modules
 */
router.use("/whitelist", whitelistRoutes);
router.use("/", questionRoutes);
router.use("/quizzes", quizRoutes);

export default router;
