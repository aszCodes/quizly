// src/handlers/submitHandler.js
import {
	getQuestionsByQuizId,
	createAttempt,
	countAttempts,
	getQuizById,
} from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";
import { parseBody, sanitizeName } from "../utils/bodyParser.js";

const submitQuizHandler = async (req, res) => {
	try {
		const data = await parseBody(req);
		const { studentName, answers, quizId } = data;

		// Validate required fields
		if (!studentName || !answers || !quizId) {
			sendJSON(res, 400, { error: "Missing required fields" });
			return;
		}

		// Sanitize and validate student name
		const sanitizedName = sanitizeName(studentName);
		if (sanitizedName.length < 2) {
			sendJSON(res, 400, { error: "Invalid student name" });
			return;
		}

		// Validate quiz ID
		const quizIdNum = parseInt(quizId, 10);
		if (isNaN(quizIdNum) || quizIdNum < 1) {
			sendJSON(res, 400, { error: "Invalid quiz ID" });
			return;
		}

		// Check if quiz exists
		const quiz = getQuizById(quizIdNum);
		if (!quiz) {
			sendJSON(res, 404, { error: "Quiz not found" });
			return;
		}

		// Check if quiz is active
		if (!quiz.isActive) {
			sendJSON(res, 403, { error: "This quiz is not currently active" });
			return;
		}

		// Check attempt limit
		const attemptCount = countAttempts(quizIdNum, sanitizedName);
		if (attemptCount >= quiz.allowedAttempts) {
			sendJSON(res, 403, {
				error: `Maximum attempts reached (${quiz.allowedAttempts})`,
			});
			return;
		}

		// Get questions for this quiz
		const quizQuestions = getQuestionsByQuizId(quizIdNum);

		if (quizQuestions.length === 0) {
			sendJSON(res, 400, { error: "Quiz has no questions" });
			return;
		}

		// Validate answers array
		if (!Array.isArray(answers) || answers.length !== quizQuestions.length) {
			sendJSON(res, 400, {
				error: `Expected ${quizQuestions.length} answers, got ${answers.length}`,
			});
			return;
		}

		// Validate each answer is a valid number or null
		const validAnswers = answers.every(
			(ans) =>
				ans === null ||
				(typeof ans === "number" && ans >= 0 && Number.isInteger(ans))
		);

		if (!validAnswers) {
			sendJSON(res, 400, { error: "Invalid answer format" });
			return;
		}

		// Calculate score and prepare detailed results
		let score = 0;
		const detailedResults = answers.map((selectedIndex, index) => {
			const question = quizQuestions[index];

			// Validate answer is within bounds
			const isValidAnswer =
				selectedIndex !== null &&
				selectedIndex >= 0 &&
				selectedIndex < question.options.length;

			const isCorrect =
				isValidAnswer && selectedIndex === question.correctAnswerIndex;

			if (isCorrect) {
				score++;
			}

			return {
				questionText: question.questionText,
				options: question.options,
				selectedAnswer: selectedIndex,
				correctAnswer: question.correctAnswerIndex,
				isCorrect: isCorrect,
			};
		});

		const totalQuestions = quizQuestions.length;
		const percentage = Math.round((score / totalQuestions) * 100);

		// Store attempt in database
		const attemptId = createAttempt(
			quizIdNum,
			sanitizedName,
			answers,
			score,
			totalQuestions
		);

		console.log(
			`Attempt ${attemptId} by ${sanitizedName}: ${score}/${totalQuestions} (${percentage}%)`
		);

		sendJSON(res, 200, {
			score,
			totalQuestions,
			percentage,
			detailedResults,
		});
	} catch (error) {
		console.error("Error submitting quiz:", error);

		if (error.message === "Request body too large") {
			sendJSON(res, 413, { error: "Request too large" });
		} else if (error.message === "Invalid JSON") {
			sendJSON(res, 400, { error: "Invalid request format" });
		} else {
			sendJSON(res, 500, { error: "Failed to submit quiz" });
		}
	}
};

export default submitQuizHandler;
