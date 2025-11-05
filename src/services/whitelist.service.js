import * as whitelistRepo from "../repositories/whitelist.repository.js";

/**
 * Get all whitelisted students
 * @returns {Array<{id:number, name:string, section:string}>}
 * @throws {DatabaseError} Repository read failure
 */
export const getAllWhitelistedStudents = () => {
	return whitelistRepo.getAllWhitelistedStudents();
};

/**
 * Get all unique sections
 * @returns {Array<string>} List of unique section identifiers
 * @throws {DatabaseError} Repository read failure
 */
export const getAllSections = () => {
	return whitelistRepo.getAllSections();
};

/**
 * Get whitelisted students by section
 * @param {string} section - Section identifier (case-insensitive)
 * @returns {Array<{id:number, name:string, section:string}>}
 * @throws {DatabaseError} Repository read failure
 */
export const getWhitelistedStudentsBySection = section => {
	return whitelistRepo.getWhitelistedStudentsBySection(section);
};
