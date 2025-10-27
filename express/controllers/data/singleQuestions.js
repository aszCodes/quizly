import {
	fetchSingleQuestion,
	fetchQuestionById,
	fetchSingleQuestionLeaderboard,
	createSingleAttempt,
	hasAttemptedQuestion,
} from "../../db/queries/questions.js";
import { findOrCreateStudent } from "../../db/queries/students.js";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;
const MAX_DURATION = 3600000;

/**
 * GET /api/question - Get active single question
 */
export const getQuestion = (req, res, next) => {
	try {
		const question = fetchSingleQuestion();

		if (!question) {
			return res.status(404).json({ error: "No active question found" });
		}

		const { id, question_text, options } = question;
		res.json({ id, question_text, options });
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/submit - Submit single question answer
 * @param {object} req.body - { studentName, questionId, answer, duration }
 * @returns {object} - { correct, score, correctAnswer }
 */
export const submitSingleAnswer = (req, res, next) => {
	try {
		const { studentName, questionId, answer, duration } = req.body;

		// Validation
		if (
			studentName === undefined ||
			studentName === null ||
			questionId === undefined ||
			questionId === null ||
			answer === undefined ||
			answer === null ||
			duration === undefined ||
			duration === null
		) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		// QuestionId is a valid number
		if (
			typeof questionId !== "number" ||
			isNaN(questionId) ||
			questionId <= 0
		) {
			return res.status(400).json({
				error: "Invalid question ID",
			});
		}

		const answerStr = typeof answer === "string" ? answer : String(answer);
		const studentNameStr =
			typeof studentName === "string" ? studentName : String(studentName);

		// Trim inputs
		const trimmedName = studentNameStr.trim();
		const trimmedAnswer = answerStr.trim();

		// Trimmed values aren't empty
		if (!trimmedName || !trimmedAnswer) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		// Validate student name
		if (typeof studentName !== "string") {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		if (trimmedName.length < MIN_NAME_LENGTH) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		if (trimmedName.length > MAX_NAME_LENGTH) {
			return res.status(400).json({
				error: "Invalid student name",
			});
		}

		// Validate duration
		if (typeof duration !== "number" || isNaN(duration)) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		if (duration <= 0) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		if (duration > MAX_DURATION) {
			return res.status(400).json({
				error: "Invalid duration",
			});
		}

		// Get question
		const question = fetchQuestionById(questionId);

		if (!question) {
			return res.status(404).json({
				error: "Question not found",
			});
		}

		// Question is part of a quiz
		if (question.quiz_id !== null) {
			return res.status(400).json({
				error: "This question is part of a quiz. Use the quiz submission endpoint.",
			});
		}

		// Find and check if question is attempted
		const student = findOrCreateStudent(trimmedName);

		if (hasAttemptedQuestion(student.id, questionId)) {
			return res.status(400).json({
				error: "You have already attempted this question",
			});
		}

		// Calculate score
		const isCorrect =
			trimmedAnswer.toLowerCase() ===
			question.correct_answer.trim().toLowerCase();
		const score = isCorrect ? 10 : 0;

		// Save attempt
		createSingleAttempt(
			student.id,
			questionId,
			trimmedAnswer,
			score,
			duration
		);

		res.json({
			correct: isCorrect,
			score: score,
			correct_answer: question.correct_answer,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/leaderboard - Get single question leaderboard
 */
export const getSingleLeaderboard = (req, res, next) => {
	try {
		const leaderboard = fetchSingleQuestionLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
};
