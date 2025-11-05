import { Router } from "express";
import {
	getWhitelistedStudents,
	getWhitelistSections,
	getWhitelistedStudentsBySection,
} from "../controllers/whitelist.controller.js";

const router = Router();

/**
 * @route   GET /api/whitelist/students
 * @desc    Get all whitelisted students
 * @access  Public
 */
router.get("/students", getWhitelistedStudents);

/**
 * @route   GET /api/whitelist/sections
 * @desc    Get all sections
 * @access  Public
 */
router.get("/sections", getWhitelistSections);

/**
 * @route   GET /api/whitelist/sections/:section/students
 * @desc    Get students by section
 * @access  Public
 */
router.get("/sections/:section/students", getWhitelistedStudentsBySection);

export default router;
