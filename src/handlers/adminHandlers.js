// src/handlers/adminHandlers.js
import {
	getAllQuizzes,
	getQuizById,
	getQuestionsByQuizId,
	countAttempts,
} from "../db/services.js";
import { validateQuiz, validateQuestion } from "../utils/validation.js";
import db from "../db/database.js";
import sendJSON from "../utils/sendJSON.js";

// Get all quizzes with question count
export const getAllQuizzesAdmin = (req, res) => {
	try {
		const quizzes = db
			.prepare(
				`
			SELECT
				q.*,
				COUNT(qu.id) as questionCount
			FROM quizzes q
			LEFT JOIN questions qu ON q.id = qu.quizId
			GROUP BY q.id
			ORDER BY q.createdAt DESC
		`
			)
			.all();

		sendJSON(res, 200, quizzes);
	} catch (error) {
		console.error("Error fetching quizzes:", error);
		sendJSON(res, 500, { error: "Failed to fetch quizzes" });
	}
};

// Create new quiz
export const createQuiz = (req, res) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const data = JSON.parse(body);

			// Validate
			const validation = validateQuiz(data);
			if (!validation.isValid) {
				sendJSON(res, 400, { error: validation.errors.join(", ") });
				return;
			}

			const stmt = db.prepare(`
				INSERT INTO quizzes (title, description, timeLimit, allowedAttempts, isActive)
				VALUES (?, ?, ?, ?, 0)
			`);

			const result = stmt.run(
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
			console.error("Error creating quiz:", error);
			sendJSON(res, 500, { error: "Failed to create quiz" });
		}
	});
};

// Update quiz
export const updateQuiz = (req, res, quizId) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { title, description, timeLimit, allowedAttempts } =
				JSON.parse(body);

			if (!title || !timeLimit) {
				sendJSON(res, 400, { error: "Title and time limit are required" });
				return;
			}

			const stmt = db.prepare(`
				UPDATE quizzes
				SET title = ?, description = ?, timeLimit = ?, allowedAttempts = ?
				WHERE id = ?
			`);

			stmt.run(
				title,
				description || null,
				timeLimit,
				allowedAttempts || 1,
				quizId
			);

			sendJSON(res, 200, { message: "Quiz updated successfully" });
		} catch (error) {
			console.error("Error updating quiz:", error);
			sendJSON(res, 500, { error: "Failed to update quiz" });
		}
	});
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
		const stmt = db.prepare("DELETE FROM quizzes WHERE id = ?");
		stmt.run(quizId);

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
		db.prepare("UPDATE quizzes SET isActive = 0").run();

		// Activate selected quiz
		db.prepare("UPDATE quizzes SET isActive = 1 WHERE id = ?").run(quizId);

		sendJSON(res, 200, { message: "Quiz activated successfully" });
	} catch (error) {
		console.error("Error activating quiz:", error);
		sendJSON(res, 500, { error: "Failed to activate quiz" });
	}
};

// Get all questions (with correct answers for admin)
export const getAllQuestionsAdmin = (req, res) => {
	try {
		const questions = db
			.prepare(
				`
			SELECT * FROM questions ORDER BY quizId, id
		`
			)
			.all();

		const parsedQuestions = questions.map((q) => ({
			...q,
			options: JSON.parse(q.options),
		}));

		sendJSON(res, 200, parsedQuestions);
	} catch (error) {
		console.error("Error fetching questions:", error);
		sendJSON(res, 500, { error: "Failed to fetch questions" });
	}
};

// Create new question
export const createQuestion = (req, res) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { quizId, questionText, options, correctAnswerIndex } =
				JSON.parse(body);

			if (
				!quizId ||
				!questionText ||
				!options ||
				correctAnswerIndex === undefined
			) {
				sendJSON(res, 400, { error: "Missing required fields" });
				return;
			}

			if (!Array.isArray(options) || options.length < 2) {
				sendJSON(res, 400, { error: "At least 2 options are required" });
				return;
			}

			const stmt = db.prepare(`
				INSERT INTO questions (quizId, questionText, options, correctAnswerIndex)
				VALUES (?, ?, ?, ?)
			`);

			const result = stmt.run(
				quizId,
				questionText,
				JSON.stringify(options),
				correctAnswerIndex
			);

			sendJSON(res, 201, {
				id: result.lastInsertRowid,
				message: "Question created successfully",
			});
		} catch (error) {
			console.error("Error creating question:", error);
			sendJSON(res, 500, { error: "Failed to create question" });
		}
	});
};

// Update question
export const updateQuestion = (req, res, questionId) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { quizId, questionText, options, correctAnswerIndex } =
				JSON.parse(body);

			if (
				!quizId ||
				!questionText ||
				!options ||
				correctAnswerIndex === undefined
			) {
				sendJSON(res, 400, { error: "Missing required fields" });
				return;
			}

			if (!Array.isArray(options) || options.length < 2) {
				sendJSON(res, 400, { error: "At least 2 options are required" });
				return;
			}

			const stmt = db.prepare(`
				UPDATE questions
				SET quizId = ?, questionText = ?, options = ?, correctAnswerIndex = ?
				WHERE id = ?
			`);

			stmt.run(
				quizId,
				questionText,
				JSON.stringify(options),
				correctAnswerIndex,
				questionId
			);

			sendJSON(res, 200, { message: "Question updated successfully" });
		} catch (error) {
			console.error("Error updating question:", error);
			sendJSON(res, 500, { error: "Failed to update question" });
		}
	});
};

// Delete question
export const deleteQuestion = (req, res, questionId) => {
	try {
		const stmt = db.prepare("DELETE FROM questions WHERE id = ?");
		stmt.run(questionId);

		sendJSON(res, 200, { message: "Question deleted successfully" });
	} catch (error) {
		console.error("Error deleting question:", error);
		sendJSON(res, 500, { error: "Failed to delete question" });
	}
};

// Import questions from file
export const importQuestions = (req, res) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { quizId, questions } = JSON.parse(body);

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

			// Insert all questions
			const stmt = db.prepare(`
				INSERT INTO questions (quizId, questionText, options, correctAnswerIndex)
				VALUES (?, ?, ?, ?)
			`);

			const insertMany = db.transaction((questions) => {
				for (const q of questions) {
					stmt.run(
						quizId,
						q.questionText,
						JSON.stringify(q.options),
						q.correctAnswerIndex
					);
				}
			});

			insertMany(questions);

			sendJSON(res, 200, {
				message: "Questions imported successfully",
				count: questions.length,
			});
		} catch (error) {
			console.error("Error importing questions:", error);
			sendJSON(res, 500, { error: "Failed to import questions" });
		}
	});
};
