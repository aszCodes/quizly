import {
	fetchSingleQuestion,
	fetchQuestionById,
	fetchSingleQuestionLeaderboard,
	createSingleAttempt,
	hasAttemptedQuestion,
} from "../../db/queries/questions.js";
import { findOrCreateStudent } from "../../db/queries/students.js";

/**
 * GET /api/question - Get active single question
 */
export const getQuestion = (req, res, next) => {
	try {
		const question = fetchSingleQuestion();

		if (!question) {
			return res.status(404).json({ error: "No active question found" });
		}

		const { id, question_text, options } = question;
		res.json({ id, question_text, options });
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/submit - Submit single question answer
 * @param {object} req.body - { studentName, questionId, answer, duration }
 * @returns {object} - { correct, score, correctAnswer }
 */
export const submitSingleAnswer = (req, res, next) => {
	try {
		const { studentName, questionId, answer, duration } = req.body;

		// Validation
		if (!studentName || !questionId || !answer || duration === undefined) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		if (typeof studentName !== "string" || studentName.trim().length < 2) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		if (typeof duration !== "number" || duration < 0) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		// Get question
		const question = fetchQuestionById(questionId);

		if (!question) {
			return res.status(404).json({
				error: "Question not found",
			});
		}

		// Find and check if question is attempted
		const student = findOrCreateStudent(studentName.trim());

		if (hasAttemptedQuestion(student.id, questionId)) {
			return res.status(400).json({
				error: "You have already attempted this question",
			});
		}

		// Calculate score
		const isCorrect =
			answer.trim().toLowerCase() ===
			question.correct_answer.trim().toLowerCase();
		const score = isCorrect ? 10 : 0;

		// Save attempt
		createSingleAttempt(student.id, questionId, answer, score, duration);

		res.json({
			correct: isCorrect,
			score: score,
			correct_answer: question.correct_answer,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/leaderboard - Get single question leaderboard
 */
export const getSingleLeaderboard = (req, res, next) => {
	try {
		const leaderboard = fetchSingleQuestionLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
