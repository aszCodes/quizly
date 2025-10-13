// src/handlers/adminHandlers.js
import {
	getAllQuizzesWithQuestionCount,
	getQuizById,
	createQuizService,
	updateQuizService,
	deleteQuizService,
	deactivateAllQuizzes,
	activateQuizService,
	getAllQuestionsService,
	createQuestionService,
	updateQuestionService,
	deleteQuestionService,
	importQuestionsService,
} from "../db/services.js";
import { validateQuiz } from "../utils/validation.js";
import { parseBody } from "../utils/bodyParser.js";
import sendJSON from "../utils/sendJSON.js";

// Get all quizzes with question count
export const getAllQuizzesAdmin = (req, res) => {
	try {
		const quizzes = getAllQuizzesWithQuestionCount();
		sendJSON(res, 200, quizzes);
	} catch (error) {
		console.error("Error fetching quizzes:", error);
		sendJSON(res, 500, { error: "Failed to fetch quizzes" });
	}
};

// Create new quiz
export const createQuiz = async (req, res) => {
	try {
		const data = await parseBody(req);

		// Validate
		const validation = validateQuiz(data);
		if (!validation.isValid) {
			sendJSON(res, 400, { error: validation.errors.join(", ") });
			return;
		}

		const result = createQuizService(
			data.title,
			data.description || null,
			data.timeLimit,
			data.allowedAttempts || 1
		);

		sendJSON(res, 201, {
			id: result.lastInsertRowid,
			message: "Quiz created successfully",
		});
	} catch (error) {
		if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid JSON in request body" });
		} else if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request body too large" });
		} else {
			console.error("Error creating quiz:", error);
			sendJSON(res, 500, { error: "Failed to create quiz" });
		}
	}
};

// Update quiz
export const updateQuiz = async (req, res, quizId) => {
	try {
		const data = await parseBody(req);

		if (!data.title || !data.timeLimit) {
			sendJSON(res, 400, { error: "Title and time limit are required" });
			return;
		}

		updateQuizService(
			quizId,
			data.title,
			data.description || null,
			data.timeLimit,
			data.allowedAttempts || 1
		);

		sendJSON(res, 200, { message: "Quiz updated successfully" });
	} catch (error) {
		if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid JSON in request body" });
		} else if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request body too large" });
		} else {
			console.error("Error updating quiz:", error);
			sendJSON(res, 500, { error: "Failed to update quiz" });
		}
	}
};

// Delete quiz
export const deleteQuiz = (req, res, quizId) => {
	try {
		// Check if quiz exists
		const quiz = getQuizById(quizId);
		if (!quiz) {
			sendJSON(res, 404, { error: "Quiz not found" });
			return;
		}

		// Delete quiz (cascade will handle questions and attempts)
		deleteQuizService(quizId);

		sendJSON(res, 200, { message: "Quiz deleted successfully" });
	} catch (error) {
		console.error("Error deleting quiz:", error);
		sendJSON(res, 500, { error: "Failed to delete quiz" });
	}
};

// Set active quiz
export const setActiveQuiz = (req, res, quizId) => {
	try {
		// Check if quiz exists
		const quiz = getQuizById(quizId);
		if (!quiz) {
			sendJSON(res, 404, { error: "Quiz not found" });
			return;
		}

		// Deactivate all quizzes
		deactivateAllQuizzes();

		// Activate selected quiz
		activateQuizService(quizId);

		sendJSON(res, 200, { message: "Quiz activated successfully" });
	} catch (error) {
		console.error("Error activating quiz:", error);
		sendJSON(res, 500, { error: "Failed to activate quiz" });
	}
};

// Get all questions (with correct answers for admin)
export const getAllQuestionsAdmin = (req, res) => {
	try {
		const questions = getAllQuestionsService();
		sendJSON(res, 200, questions);
	} catch (error) {
		console.error("Error fetching questions:", error);
		sendJSON(res, 500, { error: "Failed to fetch questions" });
	}
};

// Create new question
export const createQuestion = async (req, res) => {
	try {
		const data = await parseBody(req);
		const { quizId, questionText, options, correctAnswerIndex } = data;

		// Validate required fields
		if (
			!quizId ||
			!questionText ||
			!options ||
			correctAnswerIndex === undefined
		) {
			sendJSON(res, 400, { error: "Missing required fields" });
			return;
		}

		// Validate options array
		if (!Array.isArray(options) || options.length < 2) {
			sendJSON(res, 400, { error: "At least 2 options are required" });
			return;
		}

		const result = createQuestionService(
			quizId,
			questionText,
			options,
			correctAnswerIndex
		);

		sendJSON(res, 201, {
			id: result.lastInsertRowid,
			message: "Question created successfully",
		});
	} catch (error) {
		if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid JSON in request body" });
		} else if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request body too large" });
		} else {
			console.error("Error creating question:", error);
			sendJSON(res, 500, { error: "Failed to create question" });
		}
	}
};

// Update question
export const updateQuestion = async (req, res, questionId) => {
	try {
		const data = await parseBody(req);
		const { quizId, questionText, options, correctAnswerIndex } = data;

		// Validate required fields
		if (
			!quizId ||
			!questionText ||
			!options ||
			correctAnswerIndex === undefined
		) {
			sendJSON(res, 400, { error: "Missing required fields" });
			return;
		}

		// Validate options array
		if (!Array.isArray(options) || options.length < 2) {
			sendJSON(res, 400, { error: "At least 2 options are required" });
			return;
		}

		updateQuestionService(
			questionId,
			quizId,
			questionText,
			options,
			correctAnswerIndex
		);

		sendJSON(res, 200, { message: "Question updated successfully" });
	} catch (error) {
		if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid JSON in request body" });
		} else if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request body too large" });
		} else {
			console.error("Error updating question:", error);
			sendJSON(res, 500, { error: "Failed to update question" });
		}
	}
};

// Delete question
export const deleteQuestion = (req, res, questionId) => {
	try {
		deleteQuestionService(questionId);
		sendJSON(res, 200, { message: "Question deleted successfully" });
	} catch (error) {
		console.error("Error deleting question:", error);
		sendJSON(res, 500, { error: "Failed to delete question" });
	}
};

// Import questions from file
export const importQuestions = async (req, res) => {
	try {
		const data = await parseBody(req);
		const { quizId, questions } = data;

		if (!quizId || !Array.isArray(questions) || questions.length === 0) {
			sendJSON(res, 400, { error: "Invalid import data" });
			return;
		}

		// Validate quiz exists
		const quiz = getQuizById(quizId);
		if (!quiz) {
			sendJSON(res, 404, { error: "Quiz not found" });
			return;
		}

		// Insert all questions using transaction
		importQuestionsService(quizId, questions);

		sendJSON(res, 200, {
			message: "Questions imported successfully",
			count: questions.length,
		});
	} catch (error) {
		if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid JSON in request body" });
		} else if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request body too large" });
		} else {
			console.error("Error importing questions:", error);
			sendJSON(res, 500, { error: "Failed to import questions" });
		}
	}
};
