import db from "../database.js";

/**
 * @typedef {Object} Question
 * @property {number} id
 * @property {string} question_text
 * @property {string} correct_answer
 * @property {Array<string>} options
 * @property {number|null} quiz_id
 * @property {number} is_active
 * @property {string} created_at
 */

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
 * Helper function to parse options JSON
 * @param {Question} question
 * @returns {Question}
 */
export const parseQuestionOptions = question => {
	if (question) {
		try {
			question.options = question.options
				? JSON.parse(question.options)
				: [];
		} catch (error) {
			throw new Error(
				`Invalid JSON in question ID ${question.id}: ${error.message}`
			);
		}
	}
	return question;
};

/**
 * Checks if a student has already attempted a single question
 * @param {number} student_id
 * @param {number} question_id
 * @returns {boolean}
 */
export function hasAttemptedQuestion(student_id, question_id) {
	const attempt = db
		.prepare(
			`
		SELECT id FROM attempts 
		WHERE student_id = ? AND question_id = ? AND quiz_id IS NULL
		LIMIT 1
	`
		)
		.get(student_id, question_id);

	return !!attempt;
}

/**
 * Gets the active single question (not part of a quiz)
 * @returns {Question|undefined}
 */
export const fetchSingleQuestion = () => {
	const question = db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE is_active = 1 AND quiz_id IS NULL
		LIMIT 1`
		)
		.get();

	return parseQuestionOptions(question);
};

/**
 * Gets a specific question by ID
 * @param {number} question_id
 * @returns {Question|undefined}
 */
export const fetchQuestionById = question_id => {
	const question = db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE id = ?`
		)
		.get(question_id);

	return parseQuestionOptions(question);
};

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
