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
const MAX_DURATION = 3600000; // 1 hour in milliseconds

/**
 * GET /api/question - Get active single question
 *
 * @description Fetch the currently active standalone question (not part of any quiz)
 *
 * @returns {Object} Question object (without correct_answer)
 * @returns {number} .id - Question ID
 * @returns {string} .question_text - The question text
 * @returns {Array<string>} .options - Array of answer options
 *
 * @behavior
 * - Returns only questions where `is_active = 1` AND `quiz_id IS NULL`
 * - Excludes `correct_answer` field from response (security)
 * - Returns first matching question (LIMIT 1)
 * - Quiz-linked questions are never returned
 * - Returns 404 if no active standalone question exists
 *
 * @errors
 * - 404: No active question found
 *
 * @example
 * // Success Response (200):
 * {
 *   "id": 42,
 *   "question_text": "What is the capital of France?",
 *   "options": ["London", "Berlin", "Paris", "Madrid"]
 * }
 *
 * // No Active Question (404):
 * {
 *   "error": "No active question found"
 * }
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
 * @description Submit answer for a standalone question and receive immediate feedback
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.studentName - Student's full name (2-255 chars, trimmed)
 * @param {string} req.body.section - Student's section (required, trimmed)
 * @param {number} req.body.questionId - Question ID being answered
 * @param {string|number} req.body.answer - Student's answer (case-insensitive)
 * @param {number} req.body.duration - Time taken in milliseconds (1-3,600,000ms)
 *
 * @returns {Object} Answer result with feedback
 * @returns {boolean} .correct - Whether the answer was correct
 * @returns {number} .score - Points earned (10 if correct, 0 if incorrect)
 * @returns {string} .correct_answer - The correct answer (always shown after submission)
 *
 * @validation
 * - All fields required (studentName, section, questionId, answer, duration)
 * - Student name: 2-255 characters after trimming, string type
 * - Section: Must be non-empty after trimming
 * - Question ID: Positive integer
 * - Answer: Non-empty after trimming, converted to string
 * - Duration: Positive number, maximum 3,600,000ms (1 hour)
 * - Student must exist in whitelist (case-insensitive name/section match)
 * - Question must exist and be standalone (quiz_id IS NULL)
 * - Student must not have previously attempted this question
 *
 * @behavior
 * - Finds existing student or creates new student record
 * - Answer comparison: case-insensitive, trimmed both sides
 * - Score: 10 points for correct answer, 0 for incorrect
 * - Creates attempt record with: student_id, question_id, answer, score, duration
 * - Prevents duplicate attempts (same student + question)
 * - Rejects attempts on quiz-linked questions
 * - Returns correct answer regardless of student's answer
 *
 * @errors
 * - 400: Missing required fields
 * - 400: Invalid question ID (not a positive number)
 * - 400: Invalid student name (wrong type, too short/long, or empty after trim)
 * - 400: Section is required (missing or empty after trim)
 * - 400: Invalid duration (not a number, negative, zero, or > 1 hour)
 * - 400: Question is part of a quiz (use quiz submission endpoint)
 * - 400: You have already attempted this question
 * - 403: Student not in whitelist (returns roster verification message)
 * - 404: Question not found
 *
 * @example
 * // Request:
 * POST /api/submit
 * {
 *   "studentName": "Juan Dela Cruz",
 *   "section": "IT - A",
 *   "questionId": 42,
 *   "answer": "Paris",
 *   "duration": 8500
 * }
 *
 * // Success Response - Correct (200):
 * {
 *   "correct": true,
 *   "score": 10,
 *   "correct_answer": "Paris"
 * }
 *
 * // Success Response - Incorrect (200):
 * {
 *   "correct": false,
 *   "score": 0,
 *   "correct_answer": "Paris"
 * }
 *
 * // Whitelist Error (403):
 * {
 *   "error": "Student not found in class roster. Please verify your name and section with your teacher."
 * }
 *
 * // Duplicate Attempt (400):
 * {
 *   "error": "You have already attempted this question"
 * }
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
 * GET /api/leaderboard - Get single question leaderboard
 *
 * @description Retrieve all attempts for standalone questions, ranked by performance
 *
 * @returns {Array<Object>} Leaderboard entries (all attempts, not limited)
 * @returns {number} [].id - Attempt ID
 * @returns {string} [].student_name - Student's full name
 * @returns {string} [].student_answer - The answer submitted
 * @returns {number} [].score - Score earned (10 or 0)
 * @returns {number} [].duration - Time taken in milliseconds
 * @returns {string} [].created_at - ISO timestamp of submission
 *
 * @behavior
 * - Returns all attempts for standalone questions (where quiz_id IS NULL)
 * - Sorted by: score DESC (highest first), then duration ASC (fastest first)
 * - Includes all attempts, not just unique students (students can appear multiple times)
 * - Returns empty array if no attempts exist
 * - No pagination (returns all results)
 * - Excludes quiz attempts entirely
 *
 * @example
 * // Success Response (200):
 * [
 *   {
 *     "id": 123,
 *     "student_name": "Maria Santos",
 *     "student_answer": "Paris",
 *     "score": 10,
 *     "duration": 5200,
 *     "created_at": "2025-01-15T10:30:45.000Z"
 *   },
 *   {
 *     "id": 124,
 *     "student_name": "Juan Dela Cruz",
 *     "student_answer": "Paris",
 *     "score": 10,
 *     "duration": 6800,
 *     "created_at": "2025-01-15T10:32:10.000Z"
 *   },
 *   {
 *     "id": 125,
 *     "student_name": "Pedro Garcia",
 *     "student_answer": "London",
 *     "score": 0,
 *     "duration": 4500,
 *     "created_at": "2025-01-15T10:33:22.000Z"
 *   }
 * ]
 *
 * // No Attempts (200):
 * []
 */
export const getSingleLeaderboard = (req, res, next) => {
	try {
		const leaderboard = fetchSingleQuestionLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
