import * as quizService from "../services/quiz.service.js";

/**
 * GET /api/quizzes
 * Fetch all active quizzes.
 */
export const getActiveQuizzes = (req, res, next) => {
	try {
		const quizzes = quizService.getActiveQuizzes();
		res.json(quizzes);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/quizzes/:id/start
 * Initialize a quiz session for a student.
 */
export const startQuizSession = (req, res, next) => {
	try {
		const { studentName, section } = req.body;
		const quizId = Number(req.params.id);
		const result = quizService.startQuizSession(
			studentName,
			section,
			quizId
		);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/quizzes/:id/answer
 * Submit an answer for the current question.
 */
export const submitQuizAnswer = (req, res, next) => {
	try {
		const { sessionToken, questionId, answer } = req.body;
		const quizId = Number(req.params.id);
		const result = quizService.submitAnswer(
			sessionToken,
			questionId,
			answer,
			quizId
		);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/current
 * Get the current question for an active quiz session.
 */
export const getCurrentQuestion = (req, res, next) => {
	try {
		const quizId = Number(req.params.id);
		const { sessionToken } = req.query;
		const result = quizService.getCurrentQuestion(sessionToken, quizId);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/leaderboard
 * Get the leaderboard for a specific quiz.
 */
export const getQuizLeaderboard = (req, res, next) => {
	try {
		const quizId = Number(req.params.id);
		const leaderboard = quizService.getLeaderboard(quizId);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
