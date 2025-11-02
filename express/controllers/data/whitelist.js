// express/controllers/data/whitelist.js
import {
	getAllWhitelistedStudents,
	getWhitelistedStudentsBySection as fetchWhitelistedStudentsBySection,
	getAllSections,
} from "../../db/queries/whitelist.js";

/**
 * GET /api/whitelist/students - Get all whitelisted students
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
