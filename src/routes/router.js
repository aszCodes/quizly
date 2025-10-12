// src/routes/router.js
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import attemptsHandler from "../handlers/attemptsHandler.js";
import quizHandler from "../handlers/quizHandler.js";
import questionsHandler from "../handlers/questionsHandler.js";
import submitHandler from "../handlers/submitHandler.js";
import {
	getAllQuizzesAdmin,
	createQuiz,
	updateQuiz,
	deleteQuiz,
	setActiveQuiz,
	getAllQuestionsAdmin,
	createQuestion,
	updateQuestion,
	deleteQuestion,
	importQuestions,
} from "../handlers/adminHandlers.js";
import sendJSON from "../utils/sendJSON.js";

export const router = async (req, res) => {
	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS"
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		res.statusCode = 200;
		res.end();
		return;
	}

	// Public API Routes
	if (req.url === "/api/quiz" && req.method === "GET") {
		quizHandler(req, res);
	} else if (req.url === "/api/questions" && req.method === "GET") {
		questionsHandler(req, res);
	} else if (req.url === "/api/submit" && req.method === "POST") {
		submitHandler(req, res);
	} else if (req.url === "/api/attempts" && req.method === "GET") {
		attemptsHandler(req, res);
	}
	// Admin API Routes
	else if (req.url === "/api/admin/quizzes" && req.method === "GET") {
		getAllQuizzesAdmin(req, res);
	} else if (req.url === "/api/admin/quizzes" && req.method === "POST") {
		createQuiz(req, res);
	} else if (
		req.url.match(/^\/api\/admin\/quizzes\/\d+$/) &&
		req.method === "PUT"
	) {
		const quizId = req.url.split("/").pop();
		updateQuiz(req, res, quizId);
	} else if (
		req.url.match(/^\/api\/admin\/quizzes\/\d+$/) &&
		req.method === "DELETE"
	) {
		const quizId = req.url.split("/").pop();
		deleteQuiz(req, res, quizId);
	} else if (
		req.url.match(/^\/api\/admin\/quizzes\/\d+\/activate$/) &&
		req.method === "PUT"
	) {
		const quizId = req.url.split("/")[4];
		setActiveQuiz(req, res, quizId);
	}
	// Admin Questions Routes
	else if (req.url === "/api/admin/questions" && req.method === "GET") {
		getAllQuestionsAdmin(req, res);
	} else if (req.url === "/api/admin/questions" && req.method === "POST") {
		createQuestion(req, res);
	} else if (
		req.url.match(/^\/api\/admin\/questions\/\d+$/) &&
		req.method === "PUT"
	) {
		const questionId = req.url.split("/").pop();
		updateQuestion(req, res, questionId);
	} else if (
		req.url.match(/^\/api\/admin\/questions\/\d+$/) &&
		req.method === "DELETE"
	) {
		const questionId = req.url.split("/").pop();
		deleteQuestion(req, res, questionId);
	} else if (
		req.url === "/api/admin/questions/import" &&
		req.method === "POST"
	) {
		importQuestions(req, res);
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
	} else if (req.url === "/admin" || req.url === "/admin.html") {
		try {
			const html = await readFile(
				join(process.cwd(), "public", "admin.html"),
				"utf-8"
			);
			res.statusCode = 200;
			res.setHeader("Content-Type", "text/html");
			res.end(html);
		} catch (error) {
			sendJSON(res, 500, { error: "Could not load admin page" });
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
