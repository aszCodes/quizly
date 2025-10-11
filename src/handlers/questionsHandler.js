// api/questions handler for GET requests
import { getSafeQuestionsByQuizId } from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";

const questionsHandler = (req, res) => {
	const questions = getSafeQuestionsByQuizId(1);
	sendJSON(res, 200, questions);
};

export default questionsHandler;
