import express from "express";
import path from "node:path";
import notFound from "./middlewares/notFound.handler.js";
import errorHandler from "./middlewares/error.handler.js";
import {
	getQuestion,
	getSingleLeaderboard,
	submitSingleAnswer,
} from "./controllers/question.controller.js";
import {
	getQuizLeaderboard,
	getActiveQuizzes,
	startQuizSession,
	submitQuizAnswer,
	getCurrentQuestion,
} from "./controllers/quiz.controller.js";
import {
	getWhitelistedStudents,
	getWhitelistSections,
	getWhitelistedStudentsBySection,
} from "./controllers/whitelist.controller.js";
import { findQuizById } from "./repositories/quiz.repository.js";
import httpLogger from "./config/logger.js";
import { validateEnv } from "./config/env.js";

try {
	validateEnv();
	console.log("✓ Environment variables validated");
} catch (error) {
	console.error("✗ Environment validation failed:", error.message);
	process.exit(1);
}

const PORT = process.env.PORT;
const HOST = process.env.HOST;

const app = express();

const __dirname = path.dirname(import.meta.filename);

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON bodies
app.use(express.json());
app.use(httpLogger);

// FRONTEND ROUTES

// Home page
app.get("/", (req, res) => {
	res.render("home");
});

// Quiz taking page
app.get("/quiz/:id", (req, res, next) => {
	const rawId = req.params.id;
	const quizId = Number(rawId);

	// Check if valid number
	if (!rawId || isNaN(quizId) || quizId <= 0) {
		return next();
	}

	// Check if quiz exists
	const quiz = findQuizById(quizId);
	if (!quiz) {
		return next();
	}

	res.render("quiz", { quizId: quizId });
});

// Quiz leaderboard page
app.get("/leaderboard/:id", (req, res, next) => {
	const rawId = req.params.id;
	const quizId = Number(rawId);

	// Check if valid number
	if (!rawId || isNaN(quizId) || quizId <= 0) {
		return next();
	}

	// Check if quiz exists
	const quiz = getQuizById(quizId);
	if (!quiz) {
		return next();
	}

	res.render("leaderboard", { quizId: quizId });
});

// Single question page
app.get("/single-question", (req, res) => {
	res.render("single-question");
});

// Single question leaderboard page
app.get("/single-leaderboard", (req, res) => {
	res.render("single-leaderboard");
});

// API ROUTES

// Whitelist endpoints
app.get("/api/whitelist/students", getWhitelistedStudents);
app.get("/api/whitelist/sections", getWhitelistSections);
app.get(
	"/api/whitelist/sections/:section/students",
	getWhitelistedStudentsBySection
);

// Single Questions
app.get("/api/question", getQuestion);
app.post("/api/submit", submitSingleAnswer);

// Quizzes
app.get("/api/quizzes", getActiveQuizzes);
app.post("/api/quizzes/:id/start", startQuizSession);
app.post("/api/quizzes/:id/answer", submitQuizAnswer);
app.get("/api/quizzes/:id/current", getCurrentQuestion);

// Leaderboards
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

// ERROR HANDLERS
app.use(notFound);
app.use(errorHandler);

if (import.meta.main) {
	app.listen(PORT, HOST, () => {
		console.log(`Running on http://${HOST}:${PORT}`);
	});
}

export default app;
