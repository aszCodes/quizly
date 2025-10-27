import db from "../database.js";
import { parseQuestionOptions } from "./questions.js";

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
export const fetchActiveQuizzes = () => {
	return db
		.prepare(
			`
			SELECT id, title, is_active, created_at
			FROM quizzes
			WHERE is_active = 1 OR is_active IS NULL OR is_active = TRUE
			ORDER BY created_at DESC`
		)
		.all();
};

/**
 * Checks if a student has already attempted a quiz
 * @param {number} student_id
 * @param {number} quiz_id
 * @returns {boolean}
 */
export const hasAttemptedQuiz = (student_id, quiz_id) => {
	const attempt = db
		.prepare(
			`
		SELECT id FROM attempts 
		WHERE student_id = ? AND quiz_id = ?
		LIMIT 1`
		)
		.get(student_id, quiz_id);

	return !!attempt;
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

/**
 * Gets a specific quiz by ID
 * @param {number} quiz_id
 * @returns {Quiz|undefined}
 */
export const getQuizById = quiz_id => {
	return db
		.prepare(
			`
		SELECT id, title, is_active, created_at
		FROM quizzes
		WHERE id = ?`
		)
		.get(quiz_id);
};

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
export const createQuizAttempt = (
	student_id,
	quiz_id,
	question_id,
	student_answer,
	score,
	duration
) => {
	// Verify referenced rows exist before inserting
	const quiz = db.prepare("SELECT id FROM quizzes WHERE id = ?").get(quiz_id);
	const question = db
		.prepare("SELECT id FROM questions WHERE id = ?")
		.get(question_id);
	const student = db
		.prepare("SELECT id FROM students WHERE id = ?")
		.get(student_id);

	if (!quiz || !question || !student) {
		// Skip insert
		return;
	}

	db.prepare(
		`
		INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration)
		VALUES (?, ?, ?, ?, ?, ?)`
	).run(student_id, quiz_id, question_id, student_answer, score, duration);
};

/**
 * Gets leaderboard for a quiz (aggregated scores per student)
 * Returns fields named as tests expect: student_name, score, duration, attempts
 */
export const fetchQuizLeaderboard = quiz_id => {
	return db
		.prepare(
			`
		SELECT 
			s.name as student_name,
			COALESCE(SUM(a.score), 0) as score,
			COALESCE(SUM(a.duration), 0) as duration,
			COUNT(a.id) as attempts
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.quiz_id = ?
		GROUP BY a.student_id
		ORDER BY score DESC, duration ASC`
		)
		.all(quiz_id);
};
