import { Router } from "express";
import { findQuizById } from "../repositories/quiz.repository.js";

const router = Router();

/**
 * @route   GET /
 * @desc    Home page - Display available quizzes
 * @access  Public
 */
router.get("/", (req, res) => {
	res.render("home");
});

/**
 * @route   GET /quiz/:id
 * @desc    Quiz taking page
 * @access  Public
 */
router.get("/quiz/:id", (req, res, next) => {
	const rawId = req.params.id;
	const quizId = Number(rawId);

	// Validate quiz ID is a positive number
	if (!rawId || isNaN(quizId) || quizId <= 0) {
		return next();
	}

	// Check if quiz exists
	const quiz = findQuizById(quizId);
	if (!quiz) {
		return next();
	}

	res.render("quiz", { quizId });
});

/**
 * @route   GET /leaderboard/:id
 * @desc    Quiz leaderboard page
 * @access  Public
 */
router.get("/leaderboard/:id", (req, res, next) => {
	const rawId = req.params.id;
	const quizId = Number(rawId);

	// Validate quiz ID is a positive number
	if (!rawId || isNaN(quizId) || quizId <= 0) {
		return next();
	}

	// Check if quiz exists
	const quiz = findQuizById(quizId);
	if (!quiz) {
		return next();
	}

	res.render("leaderboard", { quizId });
});

/**
 * @route   GET /single-question
 * @desc    Single question page
 * @access  Public
 */
router.get("/single-question", (req, res) => {
	res.render("single-question");
});

/**
 * @route   GET /single-leaderboard
 * @desc    Single question leaderboard page
 * @access  Public
 */
router.get("/single-leaderboard", (req, res) => {
	res.render("single-leaderboard");
});

export default router;
