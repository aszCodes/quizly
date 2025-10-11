import { readFile } from "node:fs/promises";
import { join } from "node:path";
import attemptsHandler from "../handlers/attemptsHandler.js";
import quizHandler from "../handlers/quizHandler.js";
import questionsHandler from "../handlers/questionsHandler.js";
import submitHandler from "../handlers/submitHandler.js";
import sendJSON from "../utils/sendJSON.js";

export const router = async (req, res) => {
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

	// API Routes
	if (req.url === "/api/quiz" && req.method === "GET") {
		quizHandler(req, res);
	} else if (req.url === "/api/questions" && req.method === "GET") {
		questionsHandler(req, res);
	} else if (req.url === "/api/submit" && req.method === "POST") {
		submitHandler(req, res);
	} else if (req.url === "/api/attempts" && req.method === "GET") {
		attemptsHandler(req, res);
	}
	// Serve static files
	else if (req.url === "/" || req.url === "/index.html") {
		try {
			const html = await readFile(
				join(process.cwd(), "public", "index.html"),
				"utf-8"
			);
			res.statusCode = 200;
			res.setHeader("Content-Type", "text/html");
			res.end(html);
		} catch (error) {
			sendJSON(res, 500, { error: "Could not load page" });
		}
	} else if (req.url.startsWith("/css/")) {
		try {
			const css = await readFile(
				join(process.cwd(), "public", req.url),
				"utf-8"
			);
			res.statusCode = 200;
			res.setHeader("Content-Type", "text/css");
			res.end(css);
		} catch (error) {
			sendJSON(res, 404, { error: "CSS not found" });
		}
	} else if (req.url.startsWith("/js/")) {
		try {
			const js = await readFile(
				join(process.cwd(), "public", req.url),
				"utf-8"
			);
			res.statusCode = 200;
			res.setHeader("Content-Type", "application/javascript");
			res.end(js);
		} catch (error) {
			sendJSON(res, 404, { error: "JS not found" });
		}
	} else {
		sendJSON(res, 404, { error: "Not found" });
	}
};
