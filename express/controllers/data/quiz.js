import {
	fetchActiveQuizzes,
	fetchQuizLeaderboard,
	createQuizAttempt,
	fetchQuizQuestions,
	hasAttemptedQuiz,
} from "../../db/queries/quizzes.js";
import { findOrCreateStudent } from "../../db/queries/students.js";

/**
 * GET /api/quizzes - Get all active quizzes
 */
export const getActiveQuizzes = (req, res, next) => {
	try {
		const quizzes = fetchActiveQuizzes();
		res.json(quizzes);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/questions - Get all questions for a quiz
 */
export const getQuizQuestions = (req, res, next) => {
	try {
		const quiz_id = Number(req.params.id);
		const questions = fetchQuizQuestions(quiz_id);

		if (!questions || questions.length === 0) {
			return res.status(404).json({
				error: "No questions found for this quiz",
			});
		}

		// Remove correct answers
		const questionsWithOptions = questions.map(q => ({
			id: q.id,
			question_text: q.question_text,
			options: q.options,
		}));

		res.json(questionsWithOptions);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/submit-quiz - Submit quiz answers
 * @param {object} req.body - { studentName, quizId, answers: [{questionId, answer, duration}] }
 * @returns {object} - { totalScore, results, questionsAnswered }
 */
export const submitQuizAnswers = (req, res, next) => {
	try {
		const { studentName, quizId, answers } = req.body;

		// Validation
		if (
			!studentName ||
			!quizId ||
			!Array.isArray(answers) ||
			answers.length === 0
		) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		if (typeof studentName !== "string" || studentName.trim().length < 2) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		// Fetch quiz questions
		const quizQuestions = fetchQuizQuestions(quizId);

		if (!quizQuestions || quizQuestions.length === 0) {
			return res.status(404).json({
				error: "Quiz not found",
			});
		}

		// Create a map for quick lookup
		const questionsMap = new Map(quizQuestions.map(q => [q.id, q]));

		// Find and check if quiz is attempted
		const student = findOrCreateStudent(studentName.trim());

		if (hasAttemptedQuiz(student.id, quizId)) {
			return res.status(400).json({
				error: "You have already attempted this quiz",
			});
		}

		let totalScore = 0;
		const results = [];

		// Calculate scores
		for (const ans of answers) {
			const { questionId, answer, duration } = ans;

			if (!questionId || !answer || duration === undefined) {
				continue;
			}

			const question = questionsMap.get(questionId);
			if (!question) {
				continue;
			}

			const isCorrect =
				answer.trim().toLowerCase() ===
				question.correct_answer.trim().toLowerCase();
			const score = isCorrect ? 10 : 0;
			totalScore += score;

			createQuizAttempt(
				student.id,
				quizId,
				questionId,
				answer,
				score,
				duration
			);

			results.push({
				questionId,
				correct: isCorrect,
				score,
			});
		}

		res.json({
			total_score: totalScore,
			results,
			questions_answered: results.length,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
 */
export const getQuizLeaderboard = (req, res, next) => {
	try {
		const quiz_id = Number(req.params.id);
		const leaderboard = fetchQuizLeaderboard(quiz_id);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
