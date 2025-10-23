import db from "../database.js";

/**
 * @typedef {Object} Quiz
 * @property {number} id
 * @property {string} title
 * @property {number} is_active
 * @property {string} created_at
 */

/**
 * Gets all active quizzes
 * @returns {Quiz[]}
 */
export function fetchActiveQuizzes() {
	return db
		.prepare(
			`
		SELECT id, title, is_active, created_at
		FROM quizzes
		WHERE is_active = 1
		ORDER BY created_at DESC
	`
		)
		.all();
}

/**
 * Gets a specific quiz by ID
 * @param {number} quiz_id
 * @returns {Quiz|undefined}
 */
export function getQuizById(quiz_id) {
	return db
		.prepare(
			`
		SELECT id, title, is_active, created_at
		FROM quizzes
		WHERE id = ?
	`
		)
		.get(quiz_id);
}
