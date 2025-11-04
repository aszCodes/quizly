import db from "../db/database.js";
import { parseQuestionOptions } from "./question.repository.js";

/**
 * Get quiz by ID.
 * @param {number} quizId
 * @returns {{id:number, title:string, is_active:number, created_at:string}|undefined}
 */
export const findQuizById = quizId => {
	return db
		.prepare(
			`
		SELECT id, title, is_active, created_at
		FROM quizzes
		WHERE id = ?`
		)
		.get(quizId);
};

/**
 * Get all active quizzes.
 * @returns {Array<{id:number, title:string, is_active:number, created_at:string}>}
 */
export const findActiveQuizzes = () => {
	return db
		.prepare(
			`
		SELECT id, title, is_active, created_at
		FROM quizzes
		WHERE is_active = 1 OR is_active IS NULL OR is_active = TRUE
		ORDER BY created_at DESC, id DESC`
		)
		.all();
};

/**
 * Get all questions for a quiz.
 * @param {number} quizId
 * @returns {Array<{id:number, question_text:string, correct_answer:string, options:string[], quiz_id:number, is_active:number, created_at:string}>}
 */
export const findQuizQuestions = quizId => {
	const questions = db
		.prepare(
			`
		SELECT id, question_text, correct_answer, options, quiz_id, is_active, created_at
		FROM questions
		WHERE quiz_id = ?
		ORDER BY id ASC`
		)
		.all(quizId);

	return questions.map(parseQuestionOptions);
};

/**
 * Create a quiz attempt.
 * @param {number} studentId
 * @param {number} quizId
 * @param {number} questionId
 * @param {string|number} answer
 * @param {number} score
 * @param {number} duration
 * @returns {import('better-sqlite3').RunResult|null}
 */
export const createAttempt = (
	studentId,
	quizId,
	questionId,
	answer,
	score,
	duration
) => {
	const quiz = db.prepare("SELECT id FROM quizzes WHERE id = ?").get(quizId);
	const question = db
		.prepare("SELECT id FROM questions WHERE id = ?")
		.get(questionId);
	const student = db
		.prepare("SELECT id FROM students WHERE id = ?")
		.get(studentId);

	if (!quiz || !question || !student) return null;

	return db
		.prepare(
			`
		INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration)
		VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(studentId, quizId, questionId, answer, score, duration);
};

/**
 * Get leaderboard for a quiz (sorted by score, then duration).
 * @param {number} quizId
 * @param {number} [limit=5]
 * @returns {Array<{student_name:string, section:string, score:number, duration:number, attempts:number}>}
 */
export const findLeaderboard = (quizId, limit = 5) => {
	return db
		.prepare(
			`
		SELECT 
        s.name AS student_name,
        s.section AS section,
        COALESCE(SUM(a.score), 0) AS score,
        COALESCE(SUM(a.duration), 0) AS duration,
        COUNT(a.id) AS attempts
		FROM attempts a
		JOIN students s ON a.student_id = s.id
		WHERE a.quiz_id = ?
		GROUP BY a.student_id
		ORDER BY score DESC, duration ASC
		LIMIT ?`
		)
		.all(quizId, limit);
};

/**
 * Get all attempts of a student for a specific quiz.
 * @param {number} studentId
 * @param {number} quizId
 * @returns {Array<{score:number, duration:number}>}
 */
export const findStudentAttempts = (studentId, quizId) => {
	return db
		.prepare(
			`
		SELECT score, duration
		FROM attempts
		WHERE student_id = ? AND quiz_id = ?`
		)
		.all(studentId, quizId);
};
