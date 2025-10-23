import { fetchQuizLeaderboard } from "../../db/queries/attempts.js";
import { fetchActiveQuizzes } from "../../db/queries/quizzes.js";
import { fetchQuizQuestions } from "../../db/queries/questions.js";

/**
 * GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
 */
export function getQuizLeaderboard(req, res, next) {
	try {
		const quiz_id = Number(req.params.id);
		const leaderboard = fetchQuizLeaderboard(quiz_id);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
}

/**
 * GET /api/quizzes - Get all active quizzes
 */
export function getActiveQuizzes(req, res, next) {
	try {
		const quizzes = fetchActiveQuizzes();
		res.json(quizzes);
	} catch (error) {
		next(error);
	}
}

/**
 * GET /api/quizzes/:id/questions - Get all questions for a quiz
 */
export function getQuizQuestions(req, res, next) {
	try {
		const quiz_id = Number(req.params.id);
		const questions = fetchQuizQuestions(quiz_id);

		if (!questions || questions.length === 0) {
			return res.status(404).json({
				error: "No questions found for this quiz",
			});
		}

		// Parse options and remove correct answers
		const questionsWithOptions = questions.map(q => ({
			id: q.id,
			questionText: q.question_text,
			options: q.options ? JSON.parse(q.options) : [],
		}));

		res.json(questionsWithOptions);
	} catch (error) {
		next(error);
	}
}
