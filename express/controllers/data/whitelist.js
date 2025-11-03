// express/controllers/data/whitelist.js
import {
	getAllWhitelistedStudents,
	getWhitelistedStudentsBySection as fetchWhitelistedStudentsBySection,
	getAllSections,
} from "../../repositories/whitelist.repository.js";

/**
 * GET /api/whitelist/students - Get all whitelisted students
 *
 * @description Retrieve complete list of all active students in the whitelist
 *
 * @returns {Array<Object>} Array of whitelisted student objects
 * @returns {number} [].id - Student whitelist record ID
 * @returns {string} [].name - Student's full name
 * @returns {string} [].section - Student's section identifier
 * @returns {number} [].is_active - Active status (1 = active, 0 = inactive)
 * @returns {string} [].created_at - ISO timestamp of when student was added
 *
 * @behavior
 * - Returns only active students (where `is_active = 1`)
 * - Results ordered by: section ASC (alphabetically), then name ASC (alphabetically)
 * - Returns empty array if no whitelisted students exist
 * - No pagination (returns all results)
 * - Excludes soft-deleted students (is_active = 0)
 *
 * @errors
 * - 500: Database error (logged to console in non-test environments)
 *
 * @example
 * // Success Response (200):
 * [
 *   {
 *     "id": 1,
 *     "name": "Alice",
 *     "section": "IT - A",
 *     "is_active": 1,
 *     "created_at": "2025-01-10T08:00:00.000Z"
 *   },
 *   {
 *     "id": 2,
 *     "name": "Bob",
 *     "section": "IT - A",
 *     "is_active": 1,
 *     "created_at": "2025-01-10T08:00:00.000Z"
 *   },
 *   {
 *     "id": 3,
 *     "name": "Charlie",
 *     "section": "IT - B",
 *     "is_active": 1,
 *     "created_at": "2025-01-10T08:00:00.000Z"
 *   }
 * ]
 *
 * // No Students (200):
 * []
 */
export const getWhitelistedStudents = (req, res, next) => {
	try {
		const students = getAllWhitelistedStudents();
		res.json(students);
	} catch (error) {
		console.error("Error getting whitelisted students:", error);
		next(error);
	}
};

/**
 * GET /api/whitelist/sections - Get all sections
 *
 * @description Retrieve list of unique section identifiers from whitelist
 *
 * @returns {Array<string>} Array of section identifiers
 *
 * @behavior
 * - Returns distinct/unique sections only (no duplicates)
 * - Only includes sections with active students (is_active = 1)
 * - Results ordered alphabetically (ASC)
 * - Returns empty array if no sections exist
 * - Excludes sections that only have inactive students
 *
 * @errors
 * - 500: Database error (logged to console in non-test environments)
 *
 * @example
 * // Success Response (200):
 * [
 *   "IT - A",
 *   "IT - B",
 *   "IT - C"
 * ]
 *
 * // No Sections (200):
 * []
 */
export const getWhitelistSections = (req, res, next) => {
	try {
		const sections = getAllSections();
		res.json(sections);
	} catch (error) {
		console.error("Error getting sections:", error);
		next(error);
	}
};

/**
 * GET /api/whitelist/sections/:section/students - Get students by section
 *
 * @description Retrieve all active students belonging to a specific section
 *
 * @param {Object} req.params
 * @param {string} req.params.section - Section identifier (URL encoded, case-insensitive)
 *
 * @returns {Array<Object>} Array of whitelisted student objects for the section
 * @returns {number} [].id - Student whitelist record ID
 * @returns {string} [].name - Student's full name
 * @returns {string} [].section - Student's section identifier
 * @returns {number} [].is_active - Active status (always 1 for returned results)
 * @returns {string} [].created_at - ISO timestamp of when student was added
 *
 * @behavior
 * - Section comparison is case-insensitive (IT - A matches it - a)
 * - Returns only active students (where `is_active = 1`)
 * - Results ordered by: name ASC (alphabetically)
 * - Returns empty array if section has no active students
 * - Returns empty array if section doesn't exist
 * - Automatically handles URL encoding (spaces, special characters)
 * - No pagination (returns all results for section)
 *
 * @errors
 * - 500: Database error (logged to console in non-test environments)
 *
 * @example
 * // Request:
 * GET /api/whitelist/sections/IT%20-%20A/students
 *
 * // Success Response (200):
 * [
 *   {
 *     "id": 1,
 *     "name": "Alice",
 *     "section": "IT - A",
 *     "is_active": 1,
 *     "created_at": "2025-01-10T08:00:00.000Z"
 *   },
 *   {
 *     "id": 2,
 *     "name": "Bob",
 *     "section": "IT - A",
 *     "is_active": 1,
 *     "created_at": "2025-01-10T08:00:00.000Z"
 *   }
 * ]
 *
 * // No Students in Section (200):
 * []
 *
 * // Case-Insensitive Match:
 * // GET /api/whitelist/sections/it%20-%20a/students
 * // Still matches "IT - A" section
 */
export const getWhitelistedStudentsBySection = (req, res, next) => {
	try {
		const section = req.params.section;
		const students = fetchWhitelistedStudentsBySection(section);
		res.json(students);
	} catch (error) {
		console.error("Error getting students by section:", error);
		next(error);
	}
};
