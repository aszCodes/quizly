// api/submit handler for POST requests
import attempts from "../data/attempts.js";
import questions from "../data/questions.js";
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

			// Get questions for this quiz
			const quizQuestions = questions.filter((q) => q.quizId === quizId);

			if (!Array.isArray(answers) || answers.length !== quizQuestions.length) {
				sendJSON(res, 400, { error: "Invalid answers array" });
				return;
			}

			// Calculate score
			let score = 0;
			answers.forEach((selectedIndex, index) => {
				if (
					quizQuestions[index] &&
					selectedIndex === quizQuestions[index].correctAnswerIndex
				) {
					score++;
				}
			});

			const totalQuestions = quizQuestions.length;
			const percentage = Math.round((score / totalQuestions) * 100);

			// Store attempt
			const attempt = {
				id: Date.now(),
				quizId,
				studentName,
				answers,
				score,
				totalQuestions,
				completedAt: new Date().toISOString(),
			};

			attempts.push(attempt);

			// Send response
			sendJSON(res, 200, { score, totalQuestions, percentage });
		} catch (error) {
			sendJSON(res, 400, { error: error });
		}
	});
};

export default submitQuizHandler;
