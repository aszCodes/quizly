import { getSafeQuestionsByQuizId, getAllQuizzes } from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";

const questionsHandler = (req, res) => {
	try {
		const quizzes = getAllQuizzes();
		const activeQuiz = quizzes.find((q) => q.isActive);

		if (!activeQuiz) {
			sendJSON(res, 404, { error: "No active quiz found" });
			return;
		}

		const questions = getSafeQuestionsByQuizId(activeQuiz.id);
		sendJSON(res, 200, questions);
	} catch (error) {
		console.error("Error fetching questions:", error);
		sendJSON(res, 500, { error: "Failed to fetch questions" });
	}
};

export default questionsHandler;
