import db from "../database.js";

/**
 * @typedef {Object} AttemptWithStudent
 * @property {number} id
 * @property {string} student_name
 * @property {string} student_answer
 * @property {number} score
 * @property {number} duration
 * @property {string} created_at
 */

/**
 * @typedef {Object} QuizAttemptWithStudent
 * @property {number} id
 * @property {string} student_name
 * @property {string} student_answer
 * @property {number} score
 * @property {number} duration
 * @property {number} quiz_id
 * @property {number} question_id
 * @property {string} created_at
 */

/**
 * Creates a single question attempt (not part of a quiz)
 * @param {number} student_id
 * @param {number} question_id
 * @param {string} student_answer
 * @param {number} score
 * @param {number} duration
 * @returns {import('better-sqlite3').RunResult}
 */
export function createSingleAttempt(
	student_id,
	question_id,
	student_answer,
	score,
	duration
) {
	return db
		.prepare(
			`
		INSERT INTO attempts (student_id, question_id, student_answer, score, duration)
		VALUES (?, ?, ?, ?, ?)
	`
		)
		.run(student_id, question_id, student_answer, score, duration);
}

/**
 * Fetches all single question leaderboard (not part of any quiz)
 * @returns {AttemptWithStudent[]}
 */
export function fetchSingleQuestionLeaderboard() {
	return db
		.prepare(
			`
		SELECT 
			a.id,
			s.name as student_name,
			a.student_answer,
			a.score,
			a.duration,
			a.created_at
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.quiz_id IS NULL
		ORDER BY a.score DESC, a.duration ASC
	`
		)
		.all();
}

/**
 * Leaderboard for single question mode
 * @param {number} question_id
 * @returns {AttemptWithStudent[]}
 */
export function getSingleQuestionLeaderboard(question_id) {
	return db
		.prepare(
			`
		SELECT 
			a.id,
			s.name as student_name,
			a.student_answer,
			a.score,
			a.duration,
			a.created_at
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.question_id = ? AND a.quiz_id IS NULL
		ORDER BY a.score DESC, a.duration ASC
	`
		)
		.all(question_id);
}

/**
 * Creates a quiz attempt
 * @param {number} student_id
 * @param {number} quiz_id
 * @param {number} question_id
 * @param {string} student_answer
 * @param {number} score
 * @param {number} duration
 * @returns {import('better-sqlite3').RunResult}
 */
export function createQuizAttempt(
	student_id,
	quiz_id,
	question_id,
	student_answer,
	score,
	duration
) {
	return db
		.prepare(
			`
		INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration)
		VALUES (?, ?, ?, ?, ?, ?)
	`
		)
		.run(student_id, quiz_id, question_id, student_answer, score, duration);
}

/**
 * Gets all attempts for a specific quiz
 * @param {number} quiz_id
 * @returns {QuizAttemptWithStudent[]}
 */
export function getQuizAttempts(quiz_id) {
	return db
		.prepare(
			`
		SELECT 
			a.id,
			s.name as student_name,
			a.student_answer,
			a.score,
			a.duration,
			a.quiz_id,
			a.question_id,
			a.created_at
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.quiz_id = ?
		ORDER BY a.created_at ASC
	`
		)
		.all(quiz_id);
}

/**
 * Gets leaderboard for a quiz (aggregated scores per student)
 * @param {number} quiz_id
 * @returns {Array<{student_name: string, total_score: number, total_duration: number, questions_answered: number}>}
 */
export function fetchQuizLeaderboard(quiz_id) {
	return db
		.prepare(
			`
		SELECT 
			s.name as student_name,
			SUM(a.score) as total_score,
			SUM(a.duration) as total_duration,
			COUNT(a.id) as questions_answered
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.quiz_id = ?
		GROUP BY a.student_id
		ORDER BY total_score DESC, total_duration ASC
	`
		)
		.all(quiz_id);
}
