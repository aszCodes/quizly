import * as quizService from "../services/quiz.service.js";

/**
 * GET /api/quizzes
 * Fetch all active quizzes.
 *
 * @description
 * Returns all quizzes where `is_active = 1`, ordered by `created_at DESC`.
 * Excludes inactive or deleted quizzes. Public endpoint.
 *
 * @returns {Promise<Array<{id:number, title:string, is_active:boolean, created_at:string}>>}
 *
 * @example
 * [
 *   { id: 2, title: "Java Basics (Week 3-4)", is_active: 1, created_at: "2025-01-15T10:30:00Z" },
 *   { id: 1, title: "Python Fundamentals", is_active: 1, created_at: "2025-01-10T14:20:00Z" }
 * ]
 */
export const getActiveQuizzes = (req, res, next) => {
	try {
		const quizzes = quizService.getActiveQuizzes();
		res.json(quizzes);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/quizzes/:id/start
 * Initialize a new quiz session for a student.
 *
 * @param {Object} req.params
 * @param {number} req.params.id - Quiz ID
 * @param {Object} req.body
 * @param {string} req.body.studentName - Full name (2–255 chars)
 * @param {string} req.body.section - Student section
 *
 * @returns {Promise<{
 *   sessionToken: string,
 *   question: { id:number, question_text:string, options:string[] },
 *   totalQuestions: number,
 *   currentIndex: number
 * }>}
 *
 * @throws {Error} 400 - Invalid input or already attempted
 * @throws {Error} 403 - Student not in whitelist
 * @throws {Error} 404 - Quiz not found or empty
 *
 * @example
 * // Request:
 * POST /api/quizzes/1/start
 * { "studentName": "Juan Dela Cruz", "section": "IT - A" }
 *
 * // Response:
 * {
 *   "sessionToken": "a1b2c3...",
 *   "question": {
 *     "id": 5,
 *     "question_text": "What is the size of an int in Java?",
 *     "options": ["8 bits", "16 bits", "32 bits", "64 bits"]
 *   },
 *   "totalQuestions": 20,
 *   "currentIndex": 0
 * }
 */
export const startQuizSession = (req, res, next) => {
	try {
		const { studentName, section } = req.body;
		const quizId = Number(req.params.id);
		const result = quizService.startQuizSession(
			studentName,
			section,
			quizId
		);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/quizzes/:id/answer
 * Submit an answer for the current quiz question.
 *
 * @param {Object} req.params
 * @param {number} req.params.id - Quiz ID
 * @param {Object} req.body
 * @param {string} req.body.sessionToken - Session token
 * @param {number} req.body.questionId - Current question ID
 * @param {string|number} req.body.answer - Student's answer
 *
 * @returns {Promise<{
 *   correct: boolean,
 *   score: number,
 *   completed: boolean,
 *   currentIndex?: number,
 *   totalQuestions?: number,
 *   nextQuestion?: { id:number, question_text:string, options:string[] },
 *   results?: { totalScore:number, correctCount:number, incorrectCount:number, questionsAnswered:number, totalDuration:number }
 * }>}
 *
 * @throws {Error} 400 - Invalid input, mismatched IDs, invalid timing
 * @throws {Error} 401 - Invalid or expired session
 * @throws {Error} 404 - Question not found
 *
 * @example
 * // Response (in-progress)
 * {
 *   "correct": true,
 *   "score": 1,
 *   "completed": false,
 *   "nextQuestion": { "id": 12, "question_text": "...", "options": ["A", "B", "C", "D"] },
 *   "currentIndex": 5,
 *   "totalQuestions": 20
 * }
 *
 * // Response (completed)
 * {
 *   "correct": true,
 *   "completed": true,
 *   "results": { "totalScore": 18, "correctCount": 18, "incorrectCount": 2 }
 * }
 */
export const submitQuizAnswer = (req, res, next) => {
	try {
		const { sessionToken, questionId, answer } = req.body;
		const quizId = Number(req.params.id);
		const result = quizService.submitAnswer(
			sessionToken,
			questionId,
			answer,
			quizId
		);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/current
 * Retrieve the current question for an active quiz session.
 *
 * @param {Object} req.params
 * @param {number} req.params.id - Quiz ID
 * @param {Object} req.query
 * @param {string} req.query.sessionToken - Session token
 *
 * @returns {Promise<{ question:{ id:number, question_text:string, options:string[] }, currentIndex:number, totalQuestions:number }>}
 *
 * @throws {Error} 401 - Invalid or expired session
 */
export const getCurrentQuestion = (req, res, next) => {
	try {
		const quizId = Number(req.params.id);
		const { sessionToken } = req.query;
		const result = quizService.getCurrentQuestion(sessionToken, quizId);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/quizzes/:id/leaderboard
 * Retrieve top performers for a specific quiz.
 *
 * @param {Object} req.params
 * @param {number} req.params.id - Quiz ID
 *
 * @returns {Promise<Array<{ student_name:string, section:string, score:number, duration:number, attempts:number }>>}
 *
 * @description
 * Aggregates all attempts per student, sorted by score (desc) and duration (asc).
 * Returns top 5 entries.
 *
 * @throws {Error} 400 - Invalid quiz ID
 * @throws {Error} 404 - Quiz not found
 *
 * @example
 * [
 *   { "student_name": "Maria Santos", "section": "IT - A", "score": 20, "duration": 180000, "attempts": 20 },
 *   { "student_name": "Juan Dela Cruz", "section": "IT - A", "score": 19, "duration": 210000, "attempts": 20 }
 * ]
 */
export const getQuizLeaderboard = (req, res, next) => {
	try {
		const quizId = Number(req.params.id);
		const leaderboard = quizService.getLeaderboard(quizId);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
