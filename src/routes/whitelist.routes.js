import { Router } from "express";
import {
	getWhitelistedStudents,
	getWhitelistSections,
	getWhitelistedStudentsBySection,
} from "../controllers/whitelist.controller.js";

const router = Router();

/**
 * @swagger
 * /api/whitelist/students:
 *   get:
 *     summary: Get all whitelisted students
 *     tags: [Whitelist]
 *     responses:
 *       200:
 *         description: List of whitelisted students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WhitelistedStudent'
 */
router.get("/students", getWhitelistedStudents);

/**
 * @swagger
 * /api/whitelist/sections:
 *   get:
 *     summary: Get all sections
 *     tags: [Whitelist]
 *     responses:
 *       200:
 *         description: List of unique sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["IT - A", "IT - B", "IT - C"]
 */
router.get("/sections", getWhitelistSections);

/**
 * @swagger
 * /api/whitelist/sections/{section}/students:
 *   get:
 *     summary: Get students by section
 *     tags: [Whitelist]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *         description: Section name
 *         example: IT - A
 *     responses:
 *       200:
 *         description: List of students in the section
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WhitelistedStudent'
 */
router.get("/sections/:section/students", getWhitelistedStudentsBySection);

export default router;
