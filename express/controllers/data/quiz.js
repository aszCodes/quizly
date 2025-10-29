import {
	fetchActiveQuizzes,
	fetchQuizLeaderboard,
	createQuizAttempt,
	fetchQuizQuestions,
	hasAttemptedQuiz,
	getQuizById,
} from "../../db/queries/quizzes.js";
import { findOrCreateStudent } from "../../db/queries/students.js";

/**
 * GET /api/quizzes - Get all active quizzes
 *
 * @description Fetch the currently active single question (not part of any quiz)
 * @returns {Array} Array of `{ id, title, is_active, created_at }`
 * @behavior
 * - Only returns active quizzes (`is_active = 1`)
 * - Ordered by newest first
 * - Excludes sensitive fields like `deleted_at`
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
 *
 * @description Get all questions for a specific quiz
 * @param {string} req.params.id - Quiz ID
 * @returns {Array} Array of `{ id, question_text, options[] }`
 * @behavior
 * - Excludes `correct_answer`
 * - Validates quiz ID (numeric, positive)
 * - Returns 404 if quiz doesn't exist or has no questions
 * - Returns 400 for invalid IDs (non-numeric, zero, negative)
 */
export const getQuizQuestions = (req, res, next) => {
	try {
		const rawId = req.params.id;
		const quiz_id = Number(rawId);

		if (!rawId || isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		const quiz = getQuizById(quiz_id);
		if (!quiz) {
			return res.status(404).json({ error: "Quiz not found" });
		}

		const questions = fetchQuizQuestions(quiz_id);

		if (!questions || questions.length === 0) {
			return res.status(404).json({
				error: "No questions found for this quiz",
			});
		}

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
 *
 * @description Submit answers for entire quiz
 * @param {Object} req.body - Request body
 * @param {number} req.body.quizId - Quiz ID
 * @param {string} req.body.studentName - Student name (minimum 2 characters)
 * @param {string} [req.body.section] - Optional section (trimmed, rejects whitespace-only)
 * @param {Array<Object>} req.body.answers - Array of answers
 * @param {number} req.body.answers[].questionId - Question ID
 * @param {string|number} req.body.answers[].answer - Student's answer
 * @param {number} [req.body.answers[].duration] - Time taken for this question
 * @param {number} [req.body.duration] - Default duration for all questions
 *
 * @returns {Object} `{ totalScore, correctCount, incorrectCount, results[], questionsAnswered }`
 *
 * @validation
 * - Student name: minimum 2 characters
 * - Section: optional, trimmed, rejects whitespace-only
 * - Answers: must be non-empty array
 * - Duration: positive number (per-answer or top-level)
 * - Quiz must exist and have questions
 *
 * @behavior
 * - Case-insensitive answer comparison
 * - Ignores invalid question IDs (not in quiz)
 * - Uses per-answer duration if provided, falls back to top-level
 * - Converts non-string answers to strings
 * - Prevents duplicate attempts (same student + quiz)
 * - Score: 10 points per correct answer
 */
export const submitQuizAnswers = (req, res, next) => {
	try {
		const { studentName, section, quizId, answers, duration } = req.body;

		// Basic presence
		if (!studentName || !quizId || !Array.isArray(answers)) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		// Answers empty -> specific message expected by tests
		if (Array.isArray(answers) && answers.length === 0) {
			return res.status(400).json({ error: "No answers submitted" });
		}

		// Validate types
		if (typeof studentName !== "string" || studentName.trim().length < 2) {
			return res.status(400).json({ error: "Invalid student name" });
		}

		// Handle section: trim if string, convert empty string to null
		let trimmedSection = null;
		if (section !== undefined && section !== null) {
			if (typeof section === "string") {
				const cleaned = section.trim();
				trimmedSection = cleaned.length > 0 ? cleaned : null;
			}
		}

		// Validate top-level duration when provided
		if (duration !== undefined) {
			if (
				typeof duration !== "number" ||
				isNaN(duration) ||
				duration <= 0
			) {
				return res.status(400).json({ error: "Invalid duration" });
			}
		}

		// Quiz existence
		const quiz_id = Number(quizId);
		if (isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		const quizQuestions = fetchQuizQuestions(quiz_id);
		if (!quizQuestions || quizQuestions.length === 0) {
			// If quiz doesn't exist or has no questions, tests expect "Quiz not found"
			return res.status(404).json({ error: "Quiz not found" });
		}

		// Build lookup map
		const questionsMap = new Map(quizQuestions.map(q => [q.id, q]));

		// Find or create student with section
		const student = findOrCreateStudent(studentName.trim(), trimmedSection);

		// Duplicate attempt check
		if (hasAttemptedQuiz(student.id, quiz_id)) {
			return res
				.status(400)
				.json({ error: "You have already attempted this quiz" });
		}

		let totalScore = 0;
		const results = [];

		// For each answer — we allow missing per-answer duration; prefer per-answer duration then top-level duration then 0
		for (const ans of answers) {
			if (!ans || typeof ans !== "object") continue;

			const questionId = Number(ans.questionId);
			let ansValue = ans.answer;
			const ansDuration =
				ans.duration !== undefined
					? ans.duration
					: duration !== undefined
					? duration
					: 0;

			if (!questionId || ansValue === undefined || ansValue === null) {
				continue;
			}

			// Validate per-answer duration if provided
			if (ans.duration !== undefined) {
				if (
					typeof ans.duration !== "number" ||
					isNaN(ans.duration) ||
					ans.duration <= 0
				) {
					// skip invalid per-answer durations rather than aborting whole submission
					continue;
				}
			}

			const question = questionsMap.get(questionId);
			if (!question) {
				// ignore answers for question IDs that don't belong to this quiz
				continue;
			}

			// Coerce answer to string for comparison
			if (typeof ansValue !== "string") {
				ansValue = String(ansValue);
			}

			const isCorrect =
				ansValue.trim().toLowerCase() ===
				question.correct_answer.trim().toLowerCase();
			const score = isCorrect ? 10 : 0;
			totalScore += score;

			// persist attempt: duration value per attempt will be ans.duration if provided else top-level duration or 0
			createQuizAttempt(
				student.id,
				quiz_id,
				questionId,
				ansValue,
				score,
				ansDuration
			);

			results.push({
				questionId,
				correct: isCorrect,
				score,
			});
		}

		const correctCount = results.filter(r => r.correct).length;
		const incorrectCount = results.length - correctCount;

		return res.json({
			totalScore,
			correctCount,
			incorrectCount,
			results,
			questionsAnswered: results.length,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
 *
 * @description Get leaderboard for a specific quiz
 * @param {string} req.params.id - Quiz ID
 * @returns {Array} Array of `{ student_name, score, duration, attempts }`
 *
 * @behavior
 * - Aggregates all attempts per student
 * - Score: sum of all question scores
 * - Duration: sum of all question durations
 * - Sorted by: score DESC, then duration ASC
 * - Returns 404 for non-existent quiz
 * - Returns 400 for invalid quiz ID
 */
export const getQuizLeaderboard = (req, res, next) => {
	try {
		const rawId = req.params.id;
		const quiz_id = Number(rawId);

		if (!rawId || isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		// ensure quiz exists
		const quiz = getQuizById(quiz_id);
		if (!quiz) {
			return res.status(404).json({ error: "Quiz not found" });
		}

		const leaderboard = fetchQuizLeaderboard(quiz_id);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
