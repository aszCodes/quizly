import { Router } from "express";
import {
	getQuestion,
	submitSingleAnswer,
	getSingleLeaderboard,
} from "../controllers/question.controller.js";

const router = Router();

/**
 * @swagger
 * /api/question:
 *   get:
 *     summary: Get the currently active standalone question
 *     tags: [Questions]
 *     responses:
 *       200:
 *         description: Active question retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: No active question found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/question", getQuestion);

/**
 * @swagger
 * /api/submit:
 *   post:
 *     summary: Submit an answer for a standalone question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentName, section, questionId, answer, duration]
 *             properties:
 *               studentName:
 *                 type: string
 *                 example: Juan Dela Cruz
 *               section:
 *                 type: string
 *                 example: IT - A
 *               questionId:
 *                 type: integer
 *                 example: 1
 *               answer:
 *                 type: string
 *                 example: "4"
 *               duration:
 *                 type: integer
 *                 example: 5000
 *                 description: Time taken in milliseconds
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 correct:
 *                   type: boolean
 *                   example: true
 *                 score:
 *                   type: number
 *                   example: 10
 *                 correct_answer:
 *                   type: string
 *                   example: "4"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Student not whitelisted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Already attempted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/submit", submitSingleAnswer);

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get leaderboard for standalone questions
 *     tags: [Questions]
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   student_name:
 *                     type: string
 *                   student_answer:
 *                     type: string
 *                   score:
 *                     type: number
 *                   duration:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

router.get("/leaderboard", getSingleLeaderboard);

export default router;
