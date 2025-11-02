// express/db/queries/whitelist.js
import db from "../database.js";

/**
 * @typedef {Object} WhitelistedStudent
 * @property {number} id
 * @property {string} name
 * @property {string} section
 * @property {number} is_active
 * @property {string} created_at
 */

/**
 * Initialize whitelist table
 */
export function initWhitelistTable() {
	db.exec(`
		CREATE TABLE IF NOT EXISTS student_whitelist (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			section TEXT NOT NULL,
			is_active INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(name, section)
		)
	`);
}

/**
 * Check if a student is whitelisted (case-insensitive)
 * @param {string} name
 * @param {string} section
 * @returns {WhitelistedStudent|undefined}
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
 * @param {string} section
 * @returns {WhitelistedStudent[]}
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
 * Get all whitelisted students (all sections)
 * @returns {WhitelistedStudent[]}
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
 * @param {string} name
 * @param {string} section
 * @returns {import('better-sqlite3').RunResult}
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
 * Add multiple students to whitelist
 * @param {Array<{name: string, section: string}>} students
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
 * Remove a student from whitelist (soft delete)
 * @param {number} id
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
 * Get all sections
 * @returns {string[]}
 */
export function getAllSections() {
	const sections = db
		.prepare(
			`
			SELECT DISTINCT section
			FROM student_whitelist
			WHERE is_active = 1
			ORDER BY section ASC
		`
		)
		.all();
	return sections.map(s => s.section);
}
