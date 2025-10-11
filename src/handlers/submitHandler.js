// api/submit handler for POST requests
import {
	getQuestionsByQuizId,
	createAttempt,
	countAttempts,
	getQuizById,
} from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";

/**
 * accepts JSON body with the following fields:
 * studentName: string
 * answers: array of integers
 * quizId: integer
 *
 * example body:
 * {
 * 	"studentName": "John Doe",
 * 	"answers": [0],
 * 	"quizId": 1
 * }
 */

const submitQuizHandler = (req, res) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { studentName, answers, quizId } = JSON.parse(body);

			// Validate input
			if (!studentName || !studentName.trim() || !answers || !quizId) {
				sendJSON(res, 400, { error: "Missing required fields" });
				return;
			}

			// Check if quiz exists
			const quiz = getQuizById(quizId);
			if (!quiz) {
				sendJSON(res, 404, { error: "Quiz not found" });
				return;
			}

			// Check attempt limit
			const attemptCount = countAttempts(quizId, studentName);
			if (attemptCount >= quiz.allowedAttempts) {
				sendJSON(res, 403, {
					error: `You have already completed this quiz. Maximum attempts: ${quiz.allowedAttempts}`,
				});
				return;
			}

			// Get questions for this quiz
			const quizQuestions = getQuestionsByQuizId(quizId);

			if (!Array.isArray(answers) || answers.length !== quizQuestions.length) {
				sendJSON(res, 400, { error: "Invalid answers array" });
				return;
			}

			// Calculate score and prepare detailed results
			let score = 0;
			const detailedResults = answers.map((selectedIndex, index) => {
				const question = quizQuestions[index];
				const isCorrect = selectedIndex === question.correctAnswerIndex;

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
				quizId,
				studentName,
				answers,
				score,
				totalQuestions
			);

			console.log(
				`Attempt ${attemptId} created for ${studentName}: ${score}/${totalQuestions}`
			);

			sendJSON(res, 200, {
				score,
				totalQuestions,
				percentage,
				detailedResults,
			});
		} catch (error) {
			console.error("Error submitting quiz:", error);
			sendJSON(res, 500, { error: "Failed to submit quiz" });
		}
	});
};

export default submitQuizHandler;
