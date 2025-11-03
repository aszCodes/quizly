import {
	fetchActiveQuizzes,
	fetchQuizLeaderboard,
	createQuizAttempt,
	fetchQuizQuestions,
	getQuizById,
} from "../../db/queries/quizzes.js";
import { findOrCreateStudent } from "../../db/queries/students.js";
import {
	createQuizSession,
	getSessionByToken,
	isSessionValid,
	updateSessionQuestionIndex,
	completeSession,
	recordQuestionView,
	recordQuestionAnswered,
	getQuestionView,
	validateAnswerTiming,
	hasQuizSession,
} from "../../db/queries/session.js";
import { isStudentWhitelisted } from "../../db/queries/whitelist.js";
import db from "../../db/database.js";

/**
 * GET /api/quizzes - Get all active quizzes
 *
 * @description Fetch all currently active quizzes
 * @returns {Array} Array of quiz objects with structure: `{ id, title, is_active, created_at }`
 *
 * @behavior
 * - Returns only active quizzes (where `is_active = 1`)
 * - Results ordered by creation date (newest first), with ID as tiebreaker
 * - Excludes soft-deleted or inactive quizzes
 * - Returns empty array if no active quizzes exist
 * - No authentication required (public endpoint)
 *
 * @example
 * // Response:
 * [
 *   { id: 2, title: "Java Basics (Week 3-4)", is_active: 1, created_at: "2025-01-15T10:30:00Z" },
 *   { id: 1, title: "Python Fundamentals", is_active: 1, created_at: "2025-01-10T14:20:00Z" }
 * ]
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
 * POST /api/quizzes/:id/start - Start a new quiz session
 *
 * @param {Object} req.params
 * @param {string} req.params.id - Quiz ID (must be positive integer)
 * @param {Object} req.body
 * @param {string} req.body.studentName - Student's full name (2-255 characters, trimmed)
 * @param {string} req.body.section - Student's section identifier (required, trimmed)
 *
 * @returns {Object} Session initialization object
 * @returns {string} .sessionToken - Unique 64-character hex token for this session
 * @returns {Object} .question - First question object (without correct_answer)
 * @returns {number} .question.id - Question ID
 * @returns {string} .question.question_text - Question text
 * @returns {Array<string>} .question.options - Answer options
 * @returns {number} .totalQuestions - Total number of questions in quiz
 * @returns {number} .currentIndex - Current question index (always 0 for start)
 *
 * @validation
 * - Quiz ID: Must be valid positive integer
 * - Student name: 2+ characters after trimming
 * - Section: Required, must be non-empty after trimming
 * - Student must exist in whitelist with exact name/section match (case-insensitive)
 * - Quiz must exist and have is_active = 1
 * - Quiz must have at least one question
 * - Student must not have previously attempted this quiz
 *
 * @behavior
 * - Creates new quiz_session record with 30-minute expiration
 * - Generates unique session token using crypto.randomBytes(32)
 * - Shuffles question order randomly (different for each student)
 * - Finds existing student or creates new student record
 * - Records first question as "viewed" with timestamp
 * - Session token must be included in subsequent answer submissions
 * - Each student can only attempt each quiz once
 *
 * @errors
 * - 400: Invalid quiz ID format
 * - 400: Invalid student name (missing, too short)
 * - 400: Section is required
 * - 400: Student has already attempted this quiz
 * - 403: Student not in whitelist (returns roster message)
 * - 404: Quiz not found
 * - 404: No questions found for quiz
 *
 * @example
 * // Request:
 * POST /api/quizzes/1/start
 * { "studentName": "Juan Dela Cruz", "section": "IT - A" }
 *
 * // Success Response (200):
 * {
 *   "sessionToken": "a1b2c3d4...",
 *   "question": {
 *     "id": 5,
 *     "question_text": "What is the size of an int in Java?",
 *     "options": ["8 bits", "16 bits", "32 bits", "64 bits"]
 *   },
 *   "totalQuestions": 20,
 *   "currentIndex": 0
 * }
 *
 * // Error Response (403):
 * {
 *   "error": "Student not found in class roster. Please verify your name and section with your teacher."
 * }
 */
export const startQuizSession = (req, res, next) => {
	try {
		const { studentName, section } = req.body;
		const rawId = req.params.id;
		const quiz_id = Number(rawId);

		// Validate quiz ID
		if (!rawId || isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		// Validate student name
		if (
			!studentName ||
			typeof studentName !== "string" ||
			studentName.trim().length < 2
		) {
			return res.status(400).json({ error: "Invalid student name" });
		}

		const trimmedName = studentName.trim();

		// Handle section
		let trimmedSection = null;
		if (section !== undefined && section !== null) {
			if (typeof section === "string") {
				const cleaned = section.trim();
				trimmedSection = cleaned.length > 0 ? cleaned : null;
			}
		}

		// Section is required
		if (!trimmedSection) {
			return res.status(400).json({ error: "Section is required" });
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

		// Check if quiz exists
		const quiz = getQuizById(quiz_id);
		if (!quiz) {
			return res.status(404).json({ error: "Quiz not found" });
		}

		// Get questions for this quiz
		const questions = fetchQuizQuestions(quiz_id);
		if (!questions || questions.length === 0) {
			return res
				.status(404)
				.json({ error: "No questions found for this quiz" });
		}

		// Find or create student
		const student = findOrCreateStudent(trimmedName, trimmedSection);

		// Check if already attempted
		if (hasQuizSession(student.id, quiz_id)) {
			return res
				.status(400)
				.json({ error: "You have already attempted this quiz" });
		}

		// Create session with shuffled questions
		const question_ids = questions.map(q => q.id);
		const session = createQuizSession(student.id, quiz_id, question_ids);

		// Get first question
		const firstQuestionId = session.question_order[0];
		const firstQuestion = questions.find(q => q.id === firstQuestionId);

		// Record that first question was viewed
		recordQuestionView(session.id, firstQuestionId);

		// Return session token and first question (without correct answer)
		res.json({
			sessionToken: session.session_token,
			question: {
				id: firstQuestion.id,
				question_text: firstQuestion.question_text,
				options: firstQuestion.options,
			},
			totalQuestions: session.question_order.length,
			currentIndex: 0,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/quizzes/:id/answer - Submit answer for current question
 *
 * @param {Object} req.params
 * @param {string} req.params.id - Quiz ID (must match session quiz_id)
 * @param {Object} req.body
 * @param {string} req.body.sessionToken - Session token from /start endpoint
 * @param {number} req.body.questionId - ID of question being answered
 * @param {string|number} req.body.answer - Student's answer (case-insensitive comparison)
 *
 * @returns {Object} Answer result object
 * @returns {boolean} .correct - Whether answer was correct
 * @returns {number} .score - Score for this question (1 if correct, 0 if incorrect)
 * @returns {boolean} .completed - Whether this was the last question
 * @returns {Object} [.nextQuestion] - Next question object (if not completed)
 * @returns {number} [.nextQuestion.id] - Next question ID
 * @returns {string} [.nextQuestion.question_text] - Next question text
 * @returns {Array<string>} [.nextQuestion.options] - Next question options
 * @returns {number} [.currentIndex] - Updated question index (if not completed)
 * @returns {number} [.totalQuestions] - Total questions (if not completed)
 * @returns {Object} [.results] - Final quiz results (if completed)
 * @returns {number} [.results.totalScore] - Sum of all scores
 * @returns {number} [.results.correctCount] - Number of correct answers
 * @returns {number} [.results.incorrectCount] - Number of incorrect answers
 * @returns {number} [.results.questionsAnswered] - Total questions answered
 * @returns {number} [.results.totalDuration] - Total time in milliseconds
 *
 * @validation
 * - Session token must exist and be valid (not expired, not completed)
 * - Quiz ID in URL must match session's quiz_id
 * - Question ID must match current question in session
 * - Question must have been viewed before answering
 * - Question must not have been answered already
 * - Answer timing must be valid (1s minimum, 10min maximum)
 *
 * @behavior
 * - Compares answer to correct_answer (case-insensitive, trimmed)
 * - Creates attempt record with: student_id, quiz_id, question_id, answer, score, duration
 * - Calculates duration from question view time to answer submission
 * - Marks question as answered with timestamp
 * - For last question: marks session as completed, returns full results
 * - For other questions: moves to next question, records view, returns next question
 * - Question order follows shuffled sequence from session creation
 *
 * @errors
 * - 400: Missing required fields (sessionToken, questionId, answer)
 * - 400: Invalid quiz ID format
 * - 400: Quiz ID mismatch with session
 * - 400: Question ID mismatch (not current question)
 * - 400: Question was not viewed
 * - 400: Question already answered
 * - 400: Answer submitted too quickly (< 1 second)
 * - 400: Answer took too long (> 10 minutes)
 * - 401: Invalid session token
 * - 401: Session expired or completed
 * - 404: Question not found
 *
 * @example
 * // Request (middle question):
 * POST /api/quizzes/1/answer
 * {
 *   "sessionToken": "a1b2c3d4...",
 *   "questionId": 5,
 *   "answer": "32 bits"
 * }
 *
 * // Success Response - Continue (200):
 * {
 *   "correct": true,
 *   "score": 1,
 *   "completed": false,
 *   "nextQuestion": {
 *     "id": 12,
 *     "question_text": "What operator gives the remainder?",
 *     "options": ["/", "*", "%", "//"]
 *   },
 *   "currentIndex": 5,
 *   "totalQuestions": 20
 * }
 *
 * // Success Response - Completed (200):
 * {
 *   "correct": true,
 *   "score": 1,
 *   "completed": true,
 *   "results": {
 *     "totalScore": 18,
 *     "correctCount": 18,
 *     "incorrectCount": 2,
 *     "questionsAnswered": 20,
 *     "totalDuration": 245000
 *   }
 * }
 */
export const submitQuizAnswer = (req, res, next) => {
	try {
		const { sessionToken, questionId, answer } = req.body;
		const rawId = req.params.id;
		const quiz_id = Number(rawId);

		// Validate inputs
		if (
			!sessionToken ||
			!questionId ||
			answer === undefined ||
			answer === null
		) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		if (!rawId || isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		// Get session
		const session = getSessionByToken(sessionToken);

		if (!session) {
			console.error("Session not found for token:", sessionToken);
			return res.status(401).json({ error: "Invalid session token" });
		}

		// Validate session
		if (!isSessionValid(session)) {
			return res
				.status(401)
				.json({ error: "Session expired or completed" });
		}

		// Verify quiz ID matches
		if (session.quiz_id !== quiz_id) {
			return res.status(400).json({ error: "Quiz ID mismatch" });
		}

		// Get current question ID from session
		const currentQuestionId =
			session.question_order[session.current_question_index];

		// Verify submitted question ID matches current question
		if (questionId !== currentQuestionId) {
			return res.status(400).json({ error: "Question ID mismatch" });
		}

		// Get question view record
		const questionView = getQuestionView(session.id, questionId);
		if (!questionView) {
			return res.status(400).json({ error: "Question was not viewed" });
		}

		// Check if already answered
		if (questionView.answered_at) {
			return res.status(400).json({ error: "Question already answered" });
		}

		// Validate timing
		const timingValidation = validateAnswerTiming(questionView.viewed_at);
		if (!timingValidation.valid) {
			return res.status(400).json({ error: timingValidation.reason });
		}

		// Calculate duration
		const viewedAt = new Date(questionView.viewed_at);
		const now = new Date();
		const duration = now - viewedAt;

		// Get all questions to check answer
		const questions = fetchQuizQuestions(quiz_id);
		const question = questions.find(q => q.id === questionId);

		if (!question) {
			return res.status(404).json({ error: "Question not found" });
		}

		// Convert answer to string for comparison
		const answerStr = typeof answer === "string" ? answer : String(answer);

		// Check if correct
		const isCorrect =
			answerStr.trim().toLowerCase() ===
			question.correct_answer.trim().toLowerCase();
		const score = isCorrect ? 1 : 0;

		// Save attempt
		createQuizAttempt(
			session.student_id,
			quiz_id,
			questionId,
			answerStr,
			score,
			duration
		);

		// Mark question as answered
		recordQuestionAnswered(session.id, questionId);

		// Check if this was the last question
		const isLastQuestion =
			session.current_question_index ===
			session.question_order.length - 1;

		if (isLastQuestion) {
			// Mark session as completed
			completeSession(session.id);

			// Calculate final results
			const results = calculateQuizResults(session.student_id, quiz_id);

			return res.json({
				correct: isCorrect,
				score,
				completed: true,
				results,
			});
		} else {
			// Move to next question
			const nextIndex = session.current_question_index + 1;
			updateSessionQuestionIndex(session.id, nextIndex);

			const nextQuestionId = session.question_order[nextIndex];
			const nextQuestion = questions.find(q => q.id === nextQuestionId);

			// Record that next question was viewed
			recordQuestionView(session.id, nextQuestionId);

			return res.json({
				correct: isCorrect,
				score,
				completed: false,
				nextQuestion: {
					id: nextQuestion.id,
					question_text: nextQuestion.question_text,
					options: nextQuestion.options,
				},
				currentIndex: nextIndex,
				totalQuestions: session.question_order.length,
			});
		}
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/current - Get current question for a session
 *
 * @description Retrieve current question state (useful for page refresh/reconnection)
 *
 * @param {Object} req.params
 * @param {string} req.params.id - Quiz ID
 * @param {Object} req.query
 * @param {string} req.query.sessionToken - Active session token
 *
 * @returns {Object} Current question state
 * @returns {Object} .question - Current question object
 * @returns {number} .question.id - Question ID
 * @returns {string} .question.question_text - Question text
 * @returns {Array<string>} .question.options - Answer options
 * @returns {number} .currentIndex - Current question index (0-based)
 * @returns {number} .totalQuestions - Total number of questions in quiz
 *
 * @validation
 * - Session token must exist and be valid
 * - Quiz ID must match session's quiz_id
 * - Session must not be expired or completed
 *
 * @behavior
 * - Returns question at current index in shuffled question_order
 * - Does not record a new view (uses existing view timestamp)
 * - Does not advance question index
 * - Allows students to recover state after page refresh
 * - Session remains at same position
 *
 * @errors
 * - 400: Missing session token
 * - 400: Invalid quiz ID format
 * - 400: Quiz ID mismatch
 * - 401: Invalid session token
 * - 401: Session expired or completed
 * - 404: Question not found
 *
 * @example
 * // Request:
 * GET /api/quizzes/1/current?sessionToken=a1b2c3d4...
 *
 * // Success Response (200):
 * {
 *   "question": {
 *     "id": 8,
 *     "question_text": "What is the result of 10 % 3?",
 *     "options": ["0", "1", "2", "3"]
 *   },
 *   "currentIndex": 3,
 *   "totalQuestions": 20
 * }
 */
export const getCurrentQuestion = (req, res, next) => {
	try {
		const { sessionToken } = req.query;
		const rawId = req.params.id;
		const quiz_id = Number(rawId);

		if (!sessionToken) {
			return res.status(400).json({ error: "Missing session token" });
		}

		if (!rawId || isNaN(quiz_id) || quiz_id <= 0) {
			return res.status(400).json({ error: "Invalid quiz ID" });
		}

		// Get session
		const session = getSessionByToken(sessionToken);
		if (!session) {
			return res.status(401).json({ error: "Invalid session token" });
		}

		// Validate session
		if (!isSessionValid(session)) {
			return res
				.status(401)
				.json({ error: "Session expired or completed" });
		}

		// Verify quiz ID matches
		if (session.quiz_id !== quiz_id) {
			return res.status(400).json({ error: "Quiz ID mismatch" });
		}

		// Get current question
		const currentQuestionId =
			session.question_order[session.current_question_index];
		const questions = fetchQuizQuestions(quiz_id);
		const currentQuestion = questions.find(q => q.id === currentQuestionId);

		if (!currentQuestion) {
			return res.status(404).json({ error: "Question not found" });
		}

		res.json({
			question: {
				id: currentQuestion.id,
				question_text: currentQuestion.question_text,
				options: currentQuestion.options,
			},
			currentIndex: session.current_question_index,
			totalQuestions: session.question_order.length,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
 *
 * @description Retrieve aggregated quiz results for all students who attempted the quiz
 *
 * @param {Object} req.params
 * @param {string} req.params.id - Quiz ID
 *
 * @returns {Array<Object>} Leaderboard entries (max 5)
 * @returns {string} [].student_name - Student's full name
 * @returns {string} [].section - Student's section
 * @returns {number} [].score - Total score (sum of all question scores)
 * @returns {number} [].duration - Total duration in milliseconds
 * @returns {number} [].attempts - Number of questions answered
 *
 * @validation
 * - Quiz ID must be valid positive integer
 * - Quiz must exist in database
 *
 * @behavior
 * - Aggregates all attempts per student (GROUP BY student_id)
 * - Score: sum of all question scores (correct = 1, incorrect = 0)
 * - Duration: sum of all question durations
 * - Attempts: count of questions answered
 * - Sorted by: score DESC (highest first), then duration ASC (fastest first)
 * - Limited to top 5 performers
 * - Returns empty array if no attempts exist
 * - Includes section information for each student
 *
 * @errors
 * - 400: Invalid quiz ID format
 * - 404: Quiz not found
 *
 * @example
 * // Request:
 * GET /api/quizzes/1/leaderboard
 *
 * // Success Response (200):
 * [
 *   {
 *     "student_name": "Maria Santos",
 *     "section": "IT - A",
 *     "score": 20,
 *     "duration": 180000,
 *     "attempts": 20
 *   },
 *   {
 *     "student_name": "Juan Dela Cruz",
 *     "section": "IT - A",
 *     "score": 19,
 *     "duration": 210000,
 *     "attempts": 20
 *   },
 *   {
 *     "student_name": "Carlos Mendoza",
 *     "section": "IT - B",
 *     "score": 19,
 *     "duration": 225000,
 *     "attempts": 20
 *   }
 * ]
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

/**
 * Helper: Calculate quiz results for a student
 * @private
 */
function calculateQuizResults(student_id, quiz_id) {
	// Get all attempts for this student and quiz
	const studentAttempts = db
		.prepare(
			`
			SELECT score, duration
			FROM attempts
			WHERE student_id = ? AND quiz_id = ?
		`
		)
		.all(student_id, quiz_id);

	const totalScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
	const correctCount = studentAttempts.filter(a => a.score > 0).length;
	const incorrectCount = studentAttempts.length - correctCount;
	const totalDuration = studentAttempts.reduce(
		(sum, a) => sum + a.duration,
		0
	);

	return {
		totalScore,
		correctCount,
		incorrectCount,
		questionsAnswered: studentAttempts.length,
		totalDuration,
	};
}
