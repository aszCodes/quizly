import * as whitelistService from "../services/whitelist.service.js";

/**
 * GET /api/whitelist/students - Get all whitelisted students
 */
export const getWhitelistedStudents = (req, res, next) => {
	try {
		const students = whitelistService.getAllWhitelistedStudents();
		res.json(students);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/whitelist/sections - Get all sections
 */
export const getWhitelistSections = (req, res, next) => {
	try {
		const sections = whitelistService.getAllSections();
		res.json(sections);
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/whitelist/sections/:section/students - Get students by section
 */
export const getWhitelistedStudentsBySection = (req, res, next) => {
	try {
		const section = req.params.section;
		const students =
			whitelistService.getWhitelistedStudentsBySection(section);
		res.json(students);
	} catch (error) {
		next(error);
	}
};
