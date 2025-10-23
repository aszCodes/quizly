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
 * Creates a new attempt record
 * @param {number} student_id
 * @param {number} question_id
 * @param {string} student_answer
 * @param {number} score
 * @param {number} duration
 * @returns {import('better-sqlite3').RunResult}
 */
export function createAttempt(
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
 * Fetches all attempts with student information
 * @returns {AttemptWithStudent[]} Array of attempt records ordered by score DESC, duration ASC
 */
export function fetchAllAttempts() {
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
		ORDER BY a.score DESC, a.duration ASC
	`
		)
		.all();
}

/**
 * Fetches all attempts for a specific question
 * @param {number} question_id - The question ID to filter by
 * @returns {AttemptWithStudent[]} Array of attempt records for the question
 */
export function getAttemptsByQuestion(question_id) {
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
		WHERE a.question_id = ?
		ORDER BY a.score DESC, a.duration ASC
	`
		)
		.all(question_id);
}
