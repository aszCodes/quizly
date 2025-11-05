import { Router } from "express";
import {
	getActiveQuizzes,
	startQuizSession,
	submitQuizAnswer,
	getCurrentQuestion,
	getQuizLeaderboard,
} from "../controllers/quiz.controller.js";

const router = Router();

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Get all active quizzes
 *     tags: [Quizzes]
 *     responses:
 *       200:
 *         description: List of active quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quiz'
 */
router.get("/", getActiveQuizzes);

/**
 * @swagger
 * /api/quizzes/{id}/start:
 *   post:
 *     summary: Start a quiz session
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartQuizRequest'
 *     responses:
 *       200:
 *         description: Quiz session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StartQuizResponse'
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
 *         description: Quiz not found
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
router.post("/:id/start", startQuizSession);

/**
 * @swagger
 * /api/quizzes/{id}/answer:
 *   post:
 *     summary: Submit an answer for the current quiz question
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswerRequest'
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmitAnswerResponse'
 *       400:
 *         description: Invalid input or question mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/answer", submitQuizAnswer);

/**
 * @swagger
 * /api/quizzes/{id}/current:
 *   get:
 *     summary: Get the current question for an active quiz session
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *       - in: query
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     responses:
 *       200:
 *         description: Current question retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *                 currentIndex:
 *                   type: integer
 *                   example: 0
 *                 totalQuestions:
 *                   type: integer
 *                   example: 20
 *       400:
 *         description: Missing session token or invalid quiz ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/current", getCurrentQuestion);

/**
 * @swagger
 * /api/quizzes/{id}/leaderboard:
 *   get:
 *     summary: Get leaderboard for a specific quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeaderboardEntry'
 *       400:
 *         description: Invalid quiz ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/leaderboard", getQuizLeaderboard);

export default router;
