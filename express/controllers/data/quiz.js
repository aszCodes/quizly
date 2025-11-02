import {
	fetchActiveQuizzes,
	fetchQuizLeaderboard,
	createQuizAttempt,
	fetchQuizQuestions,
	hasAttemptedQuiz,
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
} from "../../db/queries/session.js";
import { isStudentWhitelisted } from "../../db/queries/whitelist.js";
import db from "../../db/database.js";

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
 * POST /api/quizzes/:id/start - Start a new quiz session
 *
 * @param {Object} req.body
 * @param {string} req.body.studentName - Student name (min 2 chars)
 * @param {string} [req.body.section] - Optional section
 *
 * @returns {Object} { sessionToken, question: { id, question_text, options }, totalQuestions, currentIndex }
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
		if (hasAttemptedQuiz(student.id, quiz_id)) {
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
 * @param {Object} req.body
 * @param {string} req.body.sessionToken - Session token
 * @param {number} req.body.questionId - Question ID being answered
 * @param {string} req.body.answer - Student's answer
 *
 * @returns {Object} Success: { correct, score, nextQuestion?, completed?, results? }
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
 * GET /api/quizzes/:id/current - Get current question for a session (for page refresh)
 *
 * @param {string} req.query.sessionToken - Session token
 *
 * @returns {Object} { question, currentIndex, totalQuestions }
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

/**
 * Helper: Calculate quiz results for a student
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
