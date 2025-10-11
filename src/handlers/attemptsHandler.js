import attempts from "../data/attempts.js";
import sendJSON from "../utils/sendJSON.js";

const attemptsHandler = (req, res) => {
	sendJSON(res, 200, attempts);
};

export default attemptsHandler;
