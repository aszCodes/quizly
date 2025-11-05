import { Router } from "express";
import {
	getQuestion,
	submitSingleAnswer,
	getSingleLeaderboard,
} from "../controllers/question.controller.js";

const router = Router();

/**
 * @route   GET /api/question
 * @desc    Get the currently active standalone question
 * @access  Public
 */
router.get("/question", getQuestion);

/**
 * @route   POST /api/submit
 * @desc    Submit an answer for a standalone question
 * @access  Public
 */
router.post("/submit", submitSingleAnswer);

/**
 * @route   GET /api/leaderboard
 * @desc    Get leaderboard for standalone questions
 * @access  Public
 */
router.get("/leaderboard", getSingleLeaderboard);

export default router;
