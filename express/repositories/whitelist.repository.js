import db from "../db/database.js";

/**
 * @typedef {Object} WhitelistedStudent
 * @property {number} id - Unique identifier
 * @property {string} name - Student full name
 * @property {string} section - Section identifier
 * @property {1|0} is_active - Indicates if student is active
 * @property {string} created_at - ISO timestamp string
 */

/**
 * Check if a student is whitelisted (case-insensitive)
 * @param {string} name - Student name
 * @param {string} section - Section identifier
 * @returns {WhitelistedStudent|null} Matching whitelisted student or null if not found
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
 * Get all whitelisted students for a section
 * @param {string} section - Section identifier (case-insensitive)
 * @returns {WhitelistedStudent[]} List of whitelisted students in the section
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
 * Get all whitelisted students across all sections
 * @returns {WhitelistedStudent[]} List of all active whitelisted students
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
 * Add a student to whitelist
 * @param {string} name - Student full name
 * @param {string} section - Section identifier
 * @returns {import('better-sqlite3').RunResult} Insert operation result
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
 * Add multiple students to whitelist (ignores duplicates)
 * @param {{name: string, section: string}[]} students - List of students to insert
 * @returns {void}
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
 * Soft delete a student from whitelist
 * @param {number} id - Student ID
 * @returns {import('better-sqlite3').RunResult} Update operation result
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
 * 7️⃣ Get all unique section names
 * @returns {string[]} List of active section identifiers
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
