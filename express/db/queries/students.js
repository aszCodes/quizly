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
export const findStudentByName = name => {
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
};

/**
 * Creates a new student
 * @param {string} name
 * @param {string} section
 * @returns {import('better-sqlite3').RunResult}
 */
export const createStudent = (name, section = null) => {
	return db
		.prepare(
			`
      INSERT INTO students (name, section)
      VALUES (?, ?)
    `
		)
		.run(name, section);
};

/**
 * Finds existing student or creates a new one
 * @param {string} name
 * @param {string} section
 * @returns {Student}
 */
export const findOrCreateStudent = (name, section = null) => {
	const existing = findStudentByName(name);
	if (existing) {
		return existing;
	}

	const result = createStudent(name, section);
	return {
		id: result.lastInsertRowid,
		name: name,
		section: section,
		created_at: new Date().toISOString(),
	};
};
