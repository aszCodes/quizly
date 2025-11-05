import db from "../db/database.js";

/**
 * @typedef {Object} Student
 * @property {number} id - Unique student identifier.
 * @property {string} name - Full name of the student.
 * @property {string|null} section - Section name or null if not applicable.
 * @property {string} created_at - ISO timestamp of student creation.
 */

/**
 * Find a student by name and section (case-insensitive).
 *
 * @param {string} name - Student name.
 * @param {string|null} [section=null] - Section name, or null for none.
 * @returns {Student|undefined} The matching student, or undefined if not found.
 *
 * @throws {Error} If the database query fails.
 */
export const findStudentByNameAndSection = (name, section = null) => {
	return db
		.prepare(
			`
			SELECT id, name, section, created_at
			FROM students
			WHERE LOWER(name) = LOWER(?)
			AND (
				(LOWER(section) = LOWER(?) AND section IS NOT NULL)
				OR (section IS NULL AND ? IS NULL)
			)
			LIMIT 1`
		)
		.get(name, section, section);
};

/**
 * Create a new student record.
 *
 * @param {string} name - Student name.
 * @param {string|null} [section=null] - Section name, or null for none.
 * @returns {import('better-sqlite3').RunResult} SQLite run result containing `lastInsertRowid`.
 *
 * @throws {Error} If the insert operation fails.
 */
export const createStudent = (name, section = null) => {
	return db
		.prepare(
			`
			INSERT INTO students (name, section, created_at)
			VALUES (?, ?, datetime('now'))
		`
		)
		.run(name, section);
};

/**
 * Find an existing student or create a new one if not found.
 *
 * @param {string} name - Student name.
 * @param {string|null} [section=null] - Section name, or null for none.
 * @returns {Student} The existing or newly created student.
 *
 * @throws {Error} If database operations fail.
 */
export const findOrCreateStudent = (name, section = null) => {
	const existing = findStudentByNameAndSection(name, section);
	if (existing) return existing;

	const result = createStudent(name, section);
	return {
		id: result.lastInsertRowid,
		name,
		section,
		created_at: new Date().toISOString(),
	};
};
