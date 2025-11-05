import { Router } from "express";
import {
	getActiveQuizzes,
	startQuizSession,
	submitQuizAnswer,
	getCurrentQuestion,
	getQuizLeaderboard,
} from "../controllers/quiz.controller.js";

const router = Router();

/**
 * @route   GET /api/quizzes
 * @desc    Get all active quizzes
 * @access  Public
 */
router.get("/", getActiveQuizzes);

/**
 * @route   POST /api/quizzes/:id/start
 * @desc    Start a quiz session for a student
 * @access  Public
 */
router.post("/:id/start", startQuizSession);

/**
 * @route   POST /api/quizzes/:id/answer
 * @desc    Submit an answer for the current quiz question
 * @access  Public
 */
router.post("/:id/answer", submitQuizAnswer);

/**
 * @route   GET /api/quizzes/:id/current
 * @desc    Get the current question for an active quiz session
 * @access  Public
 */
router.get("/:id/current", getCurrentQuestion);

/**
 * @route   GET /api/quizzes/:id/leaderboard
 * @desc    Get leaderboard for a specific quiz
 * @access  Public
 */
router.get("/:id/leaderboard", getQuizLeaderboard);

export default router;
