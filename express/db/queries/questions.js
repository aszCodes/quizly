import db from "../database.js";

/**
 * @typedef {Object} Question
 * @property {number} id
 * @property {string} question_text
 * @property {string} correct_answer
 * @property {string} options - JSON string of options array
 * @property {number|null} quiz_id
 * @property {number} is_active
 * @property {string} created_at
 */

/**
 * Gets the active single question (not part of a quiz)
 * @returns {Question|undefined}
 */
export function getActiveSingleQuestion() {
	return db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE is_active = 1 AND quiz_id IS NULL
		LIMIT 1
	`
		)
		.get();
}

/**
 * Gets a specific question by ID
 * @param {number} question_id
 * @returns {Question|undefined}
 */
export function getQuestionById(question_id) {
	return db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE id = ?
	`
		)
		.get(question_id);
}

/**
 * Gets all questions for a specific quiz
 * @param {number} quiz_id
 * @returns {Question[]}
 */
export function getQuizQuestions(quiz_id) {
	return db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE quiz_id = ?
		ORDER BY id ASC
	`
		)
		.all(quiz_id);
}
