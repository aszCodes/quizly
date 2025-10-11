// api/quiz handler for GET requests
import { getAllQuizzes } from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";

const quizHandler = (req, res) => {
	try {
		const quizzes = getAllQuizzes();
		sendJSON(res, 200, quizzes);
	} catch (error) {
		console.error("Error fetching quizzes:", error);
		sendJSON(res, 500, { error: "Failed to fetch quizzes" });
	}
};

export default quizHandler;
