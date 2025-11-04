import db from "../db/database.js";
import crypto from "node:crypto";

/**
 * @typedef {Object} QuizSession
 * @property {number} id
 * @property {string} session_token
 * @property {number} student_id
 * @property {number} quiz_id
 * @property {Array<number>} question_order
 * @property {number} current_question_index
 * @property {string} started_at
 * @property {string} expires_at
 * @property {string|null} completed_at
 */

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MIN_QUESTION_TIME_MS = 1000; // 1 second
const MAX_QUESTION_TIME_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a unique session token.
 * @returns {string}
 */
function generateSessionToken() {
	return crypto.randomBytes(32).toString("hex");
}

/**
 * Shuffle an array.
 * @param {Array} array
 * @returns {Array}
 */
function shuffleArray(array) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Create a new quiz session.
 * @param {number} student_id
 * @param {number} quiz_id
 * @param {Array<number>} question_ids
 * @returns {QuizSession}
 */
export const createQuizSession = (student_id, quiz_id, question_ids) => {
	const session_token = generateSessionToken();
	const shuffled_questions = shuffleArray(question_ids);
	const question_order = JSON.stringify(shuffled_questions);

	const now = new Date();
	const expires_at = new Date(now.getTime() + SESSION_DURATION_MS);

	// Format dates as ISO strings for SQLite
	const started_at_iso = now.toISOString();
	const expires_at_iso = expires_at.toISOString();

	const result = db
		.prepare(
			`
		INSERT INTO quiz_sessions (
			session_token, 
			student_id, 
			quiz_id, 
			question_order, 
			current_question_index,
			started_at,
			expires_at
		)
		VALUES (?, ?, ?, ?, 0, ?, ?)
	`
		)
		.run(
			session_token,
			student_id,
			quiz_id,
			question_order,
			started_at_iso,
			expires_at_iso
		);

	return {
		id: Number(result.lastInsertRowid),
		session_token,
		student_id,
		quiz_id,
		question_order: shuffled_questions,
		current_question_index: 0,
		started_at: started_at_iso,
		expires_at: expires_at_iso,
		completed_at: null,
	};
};

/**
 * Get session by token.
 * @param {string} session_token
 * @returns {QuizSession|undefined}
 */
export const getSessionByToken = session_token => {
	const session = db
		.prepare(
			`
		SELECT id, session_token, student_id, quiz_id, question_order, 
		       current_question_index, started_at, expires_at, completed_at
		FROM quiz_sessions
		WHERE session_token = ?
	`
		)
		.get(session_token);

	if (!session) return undefined;

	// Parse question_order from JSON
	try {
		session.question_order = JSON.parse(session.question_order);
	} catch {
		session.question_order = [];
	}

	return session;
};

/**
 * Check if session is valid.
 * @param {QuizSession} session
 * @returns {boolean}
 */
export const isSessionValid = session => {
	if (!session || session.completed_at) return false;
	return new Date() < new Date(session.expires_at);
};

/**
 * Update session's current question index.
 * @param {number} session_id
 * @param {number} new_index
 */
export const updateSessionQuestionIndex = (session_id, new_index) => {
	db.prepare(
		`
		UPDATE quiz_sessions
		SET current_question_index = ?
		WHERE id = ?
	`
	).run(new_index, session_id);
};

/**
 * Mark session as completed.
 * @param {number} session_id
 */
export const completeSession = session_id => {
	db.prepare(
		`
		UPDATE quiz_sessions
		SET completed_at = datetime('now')
		WHERE id = ?
	`
	).run(session_id);
};

/**
 * Record a question view.
 * @param {number} session_id
 * @param {number} question_id
 */
export const recordQuestionView = (session_id, question_id) => {
	const viewed_at = new Date().toISOString();
	db.prepare(
		`
		INSERT INTO question_views (session_id, question_id, viewed_at)
		VALUES (?, ?, ?)
	`
	).run(session_id, question_id, viewed_at);
};

/**
 * Record a question as answered.
 * @param {number} session_id
 * @param {number} question_id
 */
export const recordQuestionAnswered = (session_id, question_id) => {
	db.prepare(
		`
		UPDATE question_views
		SET answered_at = datetime('now')
		WHERE session_id = ? AND question_id = ?
	`
	).run(session_id, question_id);
};

/**
 * Get question view record.
 * @param {number} session_id
 * @param {number} question_id
 * @returns {{id:number, session_id:number, question_id:number, viewed_at:string, answered_at:string|null}|undefined}
 */
export const getQuestionView = (session_id, question_id) => {
	return db
		.prepare(
			`
		SELECT id, session_id, question_id, viewed_at, answered_at
		FROM question_views
		WHERE session_id = ? AND question_id = ?
	`
		)
		.get(session_id, question_id);
};

/**
 * Validate answer timing.
 * @param {string} viewed_at
 * @returns {{valid:boolean, reason?:string}}
 */
export const validateAnswerTiming = viewed_at => {
	const duration = new Date() - new Date(viewed_at);

	if (duration < MIN_QUESTION_TIME_MS)
		return { valid: false, reason: "Answer submitted too quickly" };

	if (duration > MAX_QUESTION_TIME_MS)
		return { valid: false, reason: "Answer took too long" };

	return { valid: true };
};

/**
 * Delete expired sessions.
 * @returns {number} Deleted count
 */
export const cleanupExpiredSessions = () => {
	const result = db
		.prepare(
			`
		DELETE FROM quiz_sessions
		WHERE expires_at < datetime('now')
		AND completed_at IS NULL
	`
		)
		.run();

	return result.changes;
};

/**
 * Check if student already has a session for this quiz.
 * @param {number} student_id
 * @param {number} quiz_id
 * @returns {boolean}
 */
export const hasQuizSession = (student_id, quiz_id) => {
	const session = db
		.prepare(
			`
		SELECT id FROM quiz_sessions 
		WHERE student_id = ? AND quiz_id = ?
		LIMIT 1`
		)
		.get(student_id, quiz_id);

	return !!session;
};
