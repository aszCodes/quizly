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
 * Helper function to parse options JSON
 * @param {Question} question
 * @returns {Question}
 */
const parseQuestionOptions = question => {
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
 * Gets all questions for a specific quiz
 * @param {number} quiz_id
 * @returns {Question[]}
 */
export const fetchQuizQuestions = quiz_id => {
	const questions = db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE quiz_id = ?
		ORDER BY id ASC`
		)
		.all(quiz_id);

	return questions.map(parseQuestionOptions);
};
