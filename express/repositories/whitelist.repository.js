import db from "../db/database.js";

/**
 * @typedef {Object} WhitelistedStudent
 * @property {number} id - Unique student identifier.
 * @property {string} name - Full name of the student.
 * @property {string} section - Section name or identifier.
 * @property {1|0} is_active - Indicates if the student is active.
 * @property {string} created_at - ISO timestamp string of creation.
 */

/**
 * Check if a student is whitelisted (case-insensitive).
 *
 * @param {string} name - Student name.
 * @param {string} section - Section name or identifier.
 * @returns {WhitelistedStudent|null} The matching active whitelisted student, or null if not found.
 *
 * @throws {Error} If the database query fails.
 */
export function isStudentWhitelisted(name, section) {
	return db
		.prepare(
			`
			SELECT id, name, section, is_active, created_at
			FROM student_whitelist
			WHERE LOWER(name) = LOWER(?)
			AND LOWER(section) = LOWER(?)
			AND is_active = 1
		`
		)
		.get(name, section);
}

/**
 * Retrieve all whitelisted students for a given section.
 *
 * @param {string} section - Section name or identifier (case-insensitive).
 * @returns {WhitelistedStudent[]} List of active whitelisted students in the section.
 *
 * @throws {Error} If the database query fails.
 */
export function getWhitelistedStudentsBySection(section) {
	return db
		.prepare(
			`
			SELECT id, name, section, is_active, created_at
			FROM student_whitelist
			WHERE LOWER(section) = LOWER(?)
			AND is_active = 1
			ORDER BY name ASC
		`
		)
		.all(section);
}

/**
 * Retrieve all active whitelisted students across all sections.
 *
 * @returns {WhitelistedStudent[]} List of all active whitelisted students.
 *
 * @throws {Error} If the database query fails.
 */
export function getAllWhitelistedStudents() {
	return db
		.prepare(
			`
			SELECT id, name, section, is_active, created_at
			FROM student_whitelist
			WHERE is_active = 1
			ORDER BY section ASC, name ASC
		`
		)
		.all();
}

/**
 * Add a single student to the whitelist.
 *
 * @param {string} name - Student name.
 * @param {string} section - Section name or identifier.
 * @returns {import('better-sqlite3').RunResult} SQLite insert result (includes `lastInsertRowid`).
 *
 * @throws {Error} If the insert operation fails.
 */
export function addStudentToWhitelist(name, section) {
	return db
		.prepare(
			`
			INSERT INTO student_whitelist (name, section)
			VALUES (?, ?)
		`
		)
		.run(name, section);
}

/**
 * Add multiple students to the whitelist (ignores duplicates).
 *
 * @param {{name: string, section: string}[]} students - Array of students to insert.
 * @returns {void}
 *
 * @throws {Error} If the batch insert transaction fails.
 */
export function addMultipleStudentsToWhitelist(students) {
	const insert = db.prepare(
		`
		INSERT OR IGNORE INTO student_whitelist (name, section)
		VALUES (?, ?)
	`
	);

	const insertMany = db.transaction(students => {
		for (const student of students) {
			insert.run(student.name, student.section);
		}
	});

	insertMany(students);
}

/**
 * Soft-delete a student from the whitelist by ID.
 *
 * @param {number} id - Student ID.
 * @returns {import('better-sqlite3').RunResult} SQLite update result.
 *
 * @throws {Error} If the update operation fails.
 */
export function removeStudentFromWhitelist(id) {
	return db
		.prepare(
			`
			UPDATE student_whitelist
			SET is_active = 0
			WHERE id = ?
		`
		)
		.run(id);
}

/**
 * Retrieve all unique active section names.
 *
 * @returns {string[]} List of distinct active section identifiers.
 *
 * @throws {Error} If the database query fails.
 */
export function getAllSections() {
	const rows = db
		.prepare(
			`
			SELECT DISTINCT section
			FROM student_whitelist
			WHERE is_active = 1
			ORDER BY section ASC
		`
		)
		.all();
	return rows.map(r => r.section);
}
