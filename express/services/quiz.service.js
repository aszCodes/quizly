import * as quizRepo from "../repositories/quiz.repository.js";
import * as studentRepo from "../repositories/students.repository.js";
import * as whitelistRepo from "../repositories/whitelist.repository.js";
import * as sessionRepo from "../repositories/session.repository.js";
import { ErrorFactory, validateOrThrow } from "../errors/error.factory.js";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;

/**
 * Get all active quizzes
 * @returns {Array} List of active quizzes
 */
export const getActiveQuizzes = () => {
	return quizRepo.findActiveQuizzes();
};

/**
 * Start a new quiz session for a student
 * @param {string} studentName - Student's full name
 * @param {string} section - Student's section
 * @param {number} quizId - Quiz ID to start
 * @returns {Object} Session data with first question
 * @throws {ValidationError} Invalid input
 * @throws {ForbiddenError} Student not whitelisted
 * @throws {NotFoundError} Quiz or questions not found
 * @throws {ConflictError} Already attempted
 */
export const startQuizSession = (studentName, section, quizId) => {
	// Validate quiz ID
	validateOrThrow.positiveInteger(quizId, "quiz ID");

	// Validate and normalize student name
	const trimmedName = validateOrThrow.stringLength(
		studentName,
		"student name",
		MIN_NAME_LENGTH,
		MAX_NAME_LENGTH
	);

	// Validate and normalize section
	const trimmedSection = validateOrThrow.section(section);

	// Check whitelist
	const whitelistedStudent = whitelistRepo.isStudentWhitelisted(
		trimmedName,
		trimmedSection
	);
	validateOrThrow.whitelisted(whitelistedStudent);

	// Check if quiz exists
	const quiz = quizRepo.findQuizById(quizId);
	validateOrThrow.exists(quiz, "Quiz");

	// Get and validate questions
	const questions = quizRepo.findQuizQuestions(quizId);
	if (!questions || questions.length === 0) {
		throw ErrorFactory.noQuestions("quiz");
	}

	// Find or create student
	const student = studentRepo.findOrCreateStudent(
		trimmedName,
		trimmedSection
	);

	// Check if already attempted
	validateOrThrow.notAttempted(
		sessionRepo.hasQuizSession(student.id, quizId),
		"quiz"
	);

	// Create session with shuffled questions
	const questionIds = questions.map(q => q.id);
	const session = sessionRepo.createQuizSession(
		student.id,
		quizId,
		questionIds
	);

	// Get first question
	const firstQuestionId = session.question_order[0];
	const firstQuestion = questions.find(q => q.id === firstQuestionId);

	// Record that first question was viewed
	sessionRepo.recordQuestionView(session.id, firstQuestionId);

	// Return session data (without correct answer)
	return {
		sessionToken: session.session_token,
		question: {
			id: firstQuestion.id,
			question_text: firstQuestion.question_text,
			options: firstQuestion.options,
		},
		totalQuestions: session.question_order.length,
		currentIndex: 0,
	};
};

/**
 * Submit an answer for a quiz question
 * @param {string} sessionToken - Session token
 * @param {number} questionId - Question ID being answered
 * @param {string|number} answer - Student's answer
 * @param {number} quizId - Quiz ID
 * @returns {Object} Answer result with next question or final results
 * @throws {ValidationError} Invalid input, timing, or mismatched IDs
 * @throws {UnauthorizedError} Invalid or expired session
 * @throws {NotFoundError} Question not found
 */
export const submitAnswer = (sessionToken, questionId, answer, quizId) => {
	// Check required fields
	validateOrThrow.requiredFields({ sessionToken, questionId, answer }, [
		"sessionToken",
		"questionId",
		"answer",
	]);

	// Validate quiz ID
	validateOrThrow.positiveInteger(quizId, "quiz ID");

	// Get and validate session
	const session = sessionRepo.getSessionByToken(sessionToken);
	const isValid = sessionRepo.isSessionValid(session);
	validateOrThrow.validSession(session, isValid);

	// Verify quiz ID matches
	if (session.quiz_id !== quizId) {
		throw ErrorFactory.quizIdMismatch();
	}

	// Get current question ID from session
	const currentQuestionId =
		session.question_order[session.current_question_index];

	// Verify submitted question ID matches current question
	if (questionId !== currentQuestionId) {
		throw ErrorFactory.questionIdMismatch();
	}

	// Get question view record
	const questionView = sessionRepo.getQuestionView(session.id, questionId);
	if (!questionView) {
		throw ErrorFactory.notViewed();
	}

	// Check if already answered
	if (questionView.answered_at) {
		throw ErrorFactory.alreadyAnswered();
	}

	// Validate timing
	const timingValidation = sessionRepo.validateAnswerTiming(
		questionView.viewed_at
	);
	if (!timingValidation.valid) {
		if (timingValidation.reason.includes("quickly")) {
			throw ErrorFactory.answerTooQuick();
		} else {
			throw ErrorFactory.answerTooSlow();
		}
	}

	// Calculate duration
	const viewedAt = new Date(questionView.viewed_at);
	const now = new Date();
	const duration = now - viewedAt;

	// Get all questions to check answer
	const questions = quizRepo.findQuizQuestions(quizId);
	const question = questions.find(q => q.id === questionId);
	validateOrThrow.exists(question, "Question");

	// Convert answer to string for comparison
	const answerStr = typeof answer === "string" ? answer : String(answer);

	// Check if correct
	const isCorrect =
		answerStr.trim().toLowerCase() ===
		question.correct_answer.trim().toLowerCase();
	const score = isCorrect ? 1 : 0;

	// Save attempt
	quizRepo.createAttempt(
		session.student_id,
		quizId,
		questionId,
		answerStr,
		score,
		duration
	);

	// Mark question as answered
	sessionRepo.recordQuestionAnswered(session.id, questionId);

	// Check if this was the last question
	const isLastQuestion =
		session.current_question_index === session.question_order.length - 1;

	if (isLastQuestion) {
		// Mark session as completed
		sessionRepo.completeSession(session.id);

		// Calculate final results
		const results = calculateQuizResults(session.student_id, quizId);

		return {
			correct: isCorrect,
			score,
			completed: true,
			results,
		};
	} else {
		// Move to next question
		const nextIndex = session.current_question_index + 1;
		sessionRepo.updateSessionQuestionIndex(session.id, nextIndex);

		const nextQuestionId = session.question_order[nextIndex];
		const nextQuestion = questions.find(q => q.id === nextQuestionId);

		// Record that next question was viewed
		sessionRepo.recordQuestionView(session.id, nextQuestionId);

		return {
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
		};
	}
};

/**
 * Get current question for an active session
 * @param {string} sessionToken - Session token
 * @param {number} quizId - Quiz ID
 * @returns {Object} Current question data
 * @throws {ValidationError} Missing session token or invalid quiz ID
 * @throws {UnauthorizedError} Invalid or expired session
 * @throws {NotFoundError} Question not found
 */
export const getCurrentQuestion = (sessionToken, quizId) => {
	// Validate required fields
	if (!sessionToken) {
		throw ErrorFactory.missingSession();
	}

	// Validate quiz ID
	validateOrThrow.positiveInteger(quizId, "quiz ID");

	// Get and validate session
	const session = sessionRepo.getSessionByToken(sessionToken);
	const isValid = sessionRepo.isSessionValid(session);
	validateOrThrow.validSession(session, isValid);

	// Verify quiz ID matches
	if (session.quiz_id !== quizId) {
		throw ErrorFactory.quizIdMismatch();
	}

	// Get current question
	const currentQuestionId =
		session.question_order[session.current_question_index];
	const questions = quizRepo.findQuizQuestions(quizId);
	const currentQuestion = questions.find(q => q.id === currentQuestionId);
	validateOrThrow.exists(currentQuestion, "Question");

	return {
		question: {
			id: currentQuestion.id,
			question_text: currentQuestion.question_text,
			options: currentQuestion.options,
		},
		currentIndex: session.current_question_index,
		totalQuestions: session.question_order.length,
	};
};

/**
 * Get leaderboard for a quiz
 * @param {number} quizId - Quiz ID
 * @returns {Array} Leaderboard entries
 * @throws {ValidationError} Invalid quiz ID
 * @throws {NotFoundError} Quiz not found
 */
export const getLeaderboard = quizId => {
	// Validate quiz ID
	validateOrThrow.positiveInteger(quizId, "quiz ID");

	// Ensure quiz exists
	const quiz = quizRepo.findQuizById(quizId);
	validateOrThrow.exists(quiz, "Quiz");

	return quizRepo.findLeaderboard(quizId);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate final quiz results for a student
 * @private
 * @param {number} studentId - Student ID
 * @param {number} quizId - Quiz ID
 * @returns {Object} Quiz results summary
 */
function calculateQuizResults(studentId, quizId) {
	const studentAttempts = quizRepo.findStudentAttempts(studentId, quizId);

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
