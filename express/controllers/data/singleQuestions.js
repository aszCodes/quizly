import {
	fetchSingleQuestion,
	fetchQuestionById,
	fetchSingleQuestionLeaderboard,
	createSingleAttempt,
	hasAttemptedQuestion,
} from "../../db/queries/questions.js";
import { findOrCreateStudent } from "../../db/queries/students.js";
import { isStudentWhitelisted } from "../../db/queries/whitelist.js";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;
const MAX_DURATION = 3600000;

/**
 * GET /api/question - Get active single question
 *
 * @description Fetch the currently active single question (not part of any quiz)
 * @returns {Object} `{ id, question_text, options[] }`
 *
 * @behavior
 * - Excludes `correct_answer`
 * - Returns 404 if no active question exists
 * - Excludes quiz-linked questions
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
 *
 * @description Submit answer for a single question
 * @param {Object} req.body - Request body
 * @param {string} req.body.studentName - Student name (2-255 characters, trimmed)
 * @param {string} [req.body.section] - Optional section (trimmed, null if empty)
 * @param {number} req.body.questionId - Question ID
 * @param {string|number} req.body.answer - Student's answer (case-insensitive comparison, trimmed)
 * @param {number} req.body.duration - Time taken (positive number, max 3,600,000ms / 1 hour)
 *
 * @returns {Object} `{ correct, score, correct_answer }`
 *
 * @validation
 * - Student name: 2-255 characters, trimmed
 * - Duration: positive number, max 3,600,000ms (1 hour)
 * - Answer: case-insensitive comparison, trimmed
 * - Section: optional, trimmed, null if empty
 *
 * @behavior
 * - Score: 10 points if correct, 0 if incorrect
 * - Prevents duplicate attempts (same student + question)
 * - Rejects quiz-linked questions
 */
export const submitSingleAnswer = (req, res, next) => {
	try {
		const { studentName, section, questionId, answer, duration } = req.body;

		// Validation
		if (
			studentName === undefined ||
			studentName === null ||
			questionId === undefined ||
			questionId === null ||
			answer === undefined ||
			answer === null ||
			duration === undefined ||
			duration === null
		) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		// QuestionId is a valid number
		if (
			typeof questionId !== "number" ||
			isNaN(questionId) ||
			questionId <= 0
		) {
			return res.status(400).json({
				error: "Invalid question ID",
			});
		}

		const answerStr = typeof answer === "string" ? answer : String(answer);
		const studentNameStr =
			typeof studentName === "string" ? studentName : String(studentName);

		// Trim inputs
		const trimmedName = studentNameStr.trim();
		const trimmedAnswer = answerStr.trim();

		// Handle section: trim if string, convert empty string to null
		let trimmedSection = null;
		if (section !== undefined && section !== null) {
			if (typeof section === "string") {
				const cleaned = section.trim();
				trimmedSection = cleaned.length > 0 ? cleaned : null;
			}
		}

		// Trimmed values aren't empty
		if (!trimmedName || !trimmedAnswer) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		// Validate student name
		if (typeof studentName !== "string") {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		if (trimmedName.length < MIN_NAME_LENGTH) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		if (trimmedName.length > MAX_NAME_LENGTH) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		// Section is now REQUIRED
		if (!trimmedSection) {
			return res.status(400).json({
				error: "Section is required",
			});
		}

		// Check if student is whitelisted
		const whitelistedStudent = isStudentWhitelisted(
			trimmedName,
			trimmedSection
		);
		if (!whitelistedStudent) {
			return res.status(403).json({
				error: "Student not found in class roster. Please verify your name and section with your teacher.",
			});
		}

		// Validate duration
		if (typeof duration !== "number" || isNaN(duration)) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		if (duration <= 0) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		if (duration > MAX_DURATION) {
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

		// Question is part of a quiz
		if (question.quiz_id !== null) {
			return res.status(400).json({
				error: "This question is part of a quiz. Use the quiz submission endpoint.",
			});
		}

		// Find and check if question is attempted
		const student = findOrCreateStudent(trimmedName, trimmedSection);

		if (hasAttemptedQuestion(student.id, questionId)) {
			return res.status(400).json({
				error: "You have already attempted this question",
			});
		}

		// Calculate score
		const isCorrect =
			trimmedAnswer.toLowerCase() ===
			question.correct_answer.trim().toLowerCase();
		const score = isCorrect ? 10 : 0;

		// Save attempt
		createSingleAttempt(
			student.id,
			questionId,
			trimmedAnswer,
			score,
			duration
		);

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
 * GET /api/leaderboard - Get single question leaderboard LIMIT TO 5
 *
 * @description Get leaderboard for all single questions
 * @returns {Array} Array of `{ student_name, score, duration, created_at }`
 *
 * @behavior
 * - Sorted by: score DESC, then duration ASC
 * - Excludes quiz attempts
 */
export const getSingleLeaderboard = (req, res, next) => {
	try {
		const leaderboard = fetchSingleQuestionLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
