import quizHandler from "../handlers/quizHandler.js";
import questionsHandler from "../handlers/questionsHandler.js";
import submitHandler from "../handlers/submitHandler.js";
import { sendJSON } from "../utils/sendJSON.js";

export const router = (req, res) => {
	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		res.statusCode = 200;
		res.end();
		return;
	}

	// Route handling
	if (req.url === "/api/quiz" && req.method === "GET") {
		quizHandler(req, res);
	} else if (req.url === "/api/questions" && req.method === "GET") {
		questionsHandler(req, res);
	} else if (req.url === "/api/submit" && req.method === "POST") {
		submitHandler(req, res);
	} else {
		sendJSON(res, 404, { error: "Not found" });
	}
};
