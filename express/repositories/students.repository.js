import db from "../db/database.js";

/**
 * @typedef {Object} Student
 * @property {number} id
 * @property {string} name
 * @property {string|null} section
 * @property {string} created_at
 */

/**
 * Finds a student by name and section (case-insensitive)
 * @param {string} name
 * @param {string|null} section
 * @returns {Student|undefined}
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
 * Creates a new student
 * @param {string} name
 * @param {string|null} section
 * @returns {import('better-sqlite3').RunResult}
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
 * Finds existing student or creates a new one
 * @param {string} name
 * @param {string|null} section
 * @returns {Student}
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
