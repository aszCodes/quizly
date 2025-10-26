import { findOrCreateStudent } from "../../db/queries/students.js";
import { fetchQuestionById } from "../../db/queries/questions.js";
import {
	createSingleAttempt,
	createQuizAttempt,
} from "../../db/queries/attempts.js";

/**
 * POST /api/submit - Submit single question answer
 * @param {object} req.body - { studentName, questionId, answer, duration }
 * @returns {object} - { correct, score, correctAnswer }
 */
export function submitSingleAnswer(req, res, next) {
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

		console.log(typeof question.options);
		if (!question) {
			return res.status(404).json({
				error: "Question not found",
			});
		}

		// Find or create student
		const student = findOrCreateStudent(studentName.trim());

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
			correctAnswer: question.correct_answer,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * POST /api/submit-quiz - Submit quiz answers
 * @param {object} req.body - { studentName, quizId, answers: [{questionId, answer, duration}] }
 * @returns {object} - { totalScore, results, questionsAnswered }
 */
export function submitQuizAnswers(req, res, next) {
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

		// Find or create student
		const student = findOrCreateStudent(studentName.trim());

		let totalScore = 0;
		const results = [];

		// Calculate scores
		for (const ans of answers) {
			const { questionId, answer, duration } = ans;

			if (!questionId || !answer || duration === undefined) {
				continue;
			}

			const question = fetchQuestionById(questionId);
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
			totalScore,
			results,
			questionsAnswered: results.length,
		});
	} catch (error) {
		next(error);
	}
}
