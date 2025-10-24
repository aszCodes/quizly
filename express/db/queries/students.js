import db from "../database.js";

/**
 * @typedef {Object} Student
 * @property {number} id
 * @property {string} name
 * @property {string} created_at
 */

/**
 * Finds a student by name (case-insensitive)
 * @param {string} name
 * @returns {Student|undefined}
 */
export function findStudentByName(name) {
	return db
		.prepare(
			`
		SELECT id, name, created_at
		FROM students
		WHERE LOWER(name) = LOWER(?)
		LIMIT 1
	`
		)
		.get(name);
}

/**
 * Creates a new student
 * @param {string} name
 * @returns {import('better-sqlite3').RunResult}
 */
export function createStudent(name) {
	return db
		.prepare(
			`
		INSERT INTO students (name)
		VALUES (?)
	`
		)
		.run(name);
}

/**
 * Finds existing student or creates a new one
 * @param {string} name
 * @returns {Student}
 */
export function findOrCreateStudent(name) {
	const existing = findStudentByName(name);
	if (existing) {
		return existing;
	}

	const result = createStudent(name);
	return {
		id: result.lastInsertRowid,
		name: name,
		created_at: new Date().toISOString(),
	};
}
