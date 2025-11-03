import * as quizRepo from "../db/repositories/quizRepository.js";
import * as studentRepo from "../db/repositories/studentRepository.js";
import * as whitelistRepo from "../db/repositories/whitelistRepository.js";
import * as sessionRepo from "../db/repositories/sessionRepository.js";

// Custom error classes
class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "ValidationError";
		this.status = 400;
	}
}

class NotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = "NotFoundError";
		this.status = 404;
	}
}

class ForbiddenError extends Error {
	constructor(message) {
		super(message);
		this.name = "ForbiddenError";
		this.status = 403;
	}
}

class UnauthorizedError extends Error {
	constructor(message) {
		super(message);
		this.name = "UnauthorizedError";
		this.status = 401;
	}
}

export const getActiveQuizzes = () => {
	return quizRepo.findActiveQuizzes();
};

export const startQuizSession = (studentName, section, quizId) => {
	// Validate quiz ID
	if (!quizId || isNaN(quizId) || quizId <= 0) {
		throw new ValidationError("Invalid quiz ID");
	}

	// Validate student name
	if (
		!studentName ||
		typeof studentName !== "string" ||
		studentName.trim().length < 2
	) {
		throw new ValidationError("Invalid student name");
	}

	const trimmedName = studentName.trim();

	// Validate section
	let trimmedSection = null;
	if (section !== undefined && section !== null) {
		if (typeof section === "string") {
			const cleaned = section.trim();
			trimmedSection = cleaned.length > 0 ? cleaned : null;
		}
	}

	if (!trimmedSection) {
		throw new ValidationError("Section is required");
	}

	// Check whitelist
	const whitelistedStudent = whitelistRepo.isStudentWhitelisted(
		trimmedName,
		trimmedSection
	);
	if (!whitelistedStudent) {
		throw new ForbiddenError(
			"Student not found in class roster. Please verify your name and section with your teacher."
		);
	}

	// Check if quiz exists
	const quiz = quizRepo.findQuizById(quizId);
	if (!quiz) {
		throw new NotFoundError("Quiz not found");
	}

	// Get questions
	const questions = quizRepo.findQuizQuestions(quizId);
	if (!questions || questions.length === 0) {
		throw new NotFoundError("No questions found for this quiz");
	}

	// Find or create student
	const student = studentRepo.findOrCreateStudent(
		trimmedName,
		trimmedSection
	);

	// Check if already attempted
	if (sessionRepo.hasQuizSession(student.id, quizId)) {
		throw new ValidationError("You have already attempted this quiz");
	}

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

export const submitAnswer = (sessionToken, questionId, answer, quizId) => {
	// Validate inputs
	if (
		!sessionToken ||
		!questionId ||
		answer === undefined ||
		answer === null
	) {
		throw new ValidationError("Missing required fields");
	}

	if (!quizId || isNaN(quizId) || quizId <= 0) {
		throw new ValidationError("Invalid quiz ID");
	}

	// Get session
	const session = sessionRepo.getSessionByToken(sessionToken);
	if (!session) {
		throw new UnauthorizedError("Invalid session token");
	}

	// Validate session
	if (!sessionRepo.isSessionValid(session)) {
		throw new UnauthorizedError("Session expired or completed");
	}

	// Verify quiz ID matches
	if (session.quiz_id !== quizId) {
		throw new ValidationError("Quiz ID mismatch");
	}

	// Get current question ID from session
	const currentQuestionId =
		session.question_order[session.current_question_index];

	// Verify submitted question ID matches current question
	if (questionId !== currentQuestionId) {
		throw new ValidationError("Question ID mismatch");
	}

	// Get question view record
	const questionView = sessionRepo.getQuestionView(session.id, questionId);
	if (!questionView) {
		throw new ValidationError("Question was not viewed");
	}

	// Check if already answered
	if (questionView.answered_at) {
		throw new ValidationError("Question already answered");
	}

	// Validate timing
	const timingValidation = sessionRepo.validateAnswerTiming(
		questionView.viewed_at
	);
	if (!timingValidation.valid) {
		throw new ValidationError(timingValidation.reason);
	}

	// Calculate duration
	const viewedAt = new Date(questionView.viewed_at);
	const now = new Date();
	const duration = now - viewedAt;

	// Get all questions to check answer
	const questions = quizRepo.findQuizQuestions(quizId);
	const question = questions.find(q => q.id === questionId);

	if (!question) {
		throw new NotFoundError("Question not found");
	}

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

export const getCurrentQuestion = (sessionToken, quizId) => {
	if (!sessionToken) {
		throw new ValidationError("Missing session token");
	}

	if (!quizId || isNaN(quizId) || quizId <= 0) {
		throw new ValidationError("Invalid quiz ID");
	}

	// Get session
	const session = sessionRepo.getSessionByToken(sessionToken);
	if (!session) {
		throw new UnauthorizedError("Invalid session token");
	}

	// Validate session
	if (!sessionRepo.isSessionValid(session)) {
		throw new UnauthorizedError("Session expired or completed");
	}

	// Verify quiz ID matches
	if (session.quiz_id !== quizId) {
		throw new ValidationError("Quiz ID mismatch");
	}

	// Get current question
	const currentQuestionId =
		session.question_order[session.current_question_index];
	const questions = quizRepo.findQuizQuestions(quizId);
	const currentQuestion = questions.find(q => q.id === currentQuestionId);

	if (!currentQuestion) {
		throw new NotFoundError("Question not found");
	}

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

export const getLeaderboard = quizId => {
	if (!quizId || isNaN(quizId) || quizId <= 0) {
		throw new ValidationError("Invalid quiz ID");
	}

	// Ensure quiz exists
	const quiz = quizRepo.findQuizById(quizId);
	if (!quiz) {
		throw new NotFoundError("Quiz not found");
	}

	return quizRepo.findLeaderboard(quizId);
};

// Helper function
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
