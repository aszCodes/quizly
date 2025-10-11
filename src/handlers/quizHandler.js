// api/quiz handler for GET requests
import quiz from "../data/quiz.js";
import sendJSON from "../utils/sendJSON.js";

const quizHandler = (req, res) => {
	sendJSON(res, 200, quiz);
};

export default quizHandler;
