// api/questions handler for GET requests
import questions from "../data/questions.js";
import sendJSON from "../utils/sendJSON.js";

const questionsHandler = (req, res) => {
	const safeQuestions = questions.map((q) => ({
		id: q.id,
		quizId: q.quizId,
		questionText: q.questionText,
		options: q.options,
	}));

	sendJSON(res, 200, safeQuestions);
};

export default questionsHandler;
