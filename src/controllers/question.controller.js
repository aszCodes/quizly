import * as questionService from "../services/question.service.js";

/**
 * GET /api/question
 * Fetch the currently active standalone question (not part of any quiz).
 */
export const getQuestion = (req, res, next) => {
	try {
		const question = questionService.getActiveQuestion();
		res.json(question);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/submit
 * Submit an answer for a standalone question and get feedback.
 */
export const submitSingleAnswer = (req, res, next) => {
	try {
		const { studentName, section, questionId, answer, duration } = req.body;
		const result = questionService.submitSingleAnswer(
			studentName,
			section,
			questionId,
			answer,
			duration
		);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/leaderboard
 * Retrieve leaderboard for standalone questions (sorted by score, then duration).
 */
export const getSingleLeaderboard = (req, res, next) => {
	try {
		const leaderboard = questionService.getSingleLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
