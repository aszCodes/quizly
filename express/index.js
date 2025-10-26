import express from "express";
import path from "node:path";
import notFound from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import {
	getQuestion,
	getSingleLeaderboard,
	submitSingleAnswer,
} from "./controllers/data/singleQuestions.js";
import {
	getQuizLeaderboard,
	getActiveQuizzes,
	getQuizQuestions,
	submitQuizAnswers,
} from "./controllers/data/quiz.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

const app = express();

const __dirname = path.dirname(import.meta.filename);

// Parse JSON bodies
app.use(express.json());

// Single Questions
app.get("/api/question", getQuestion);
app.post("/api/submit", submitSingleAnswer);

// Quizzes
app.get("/api/quizzes", getActiveQuizzes);
app.get("/api/quizzes/:id/questions", getQuizQuestions);
app.post("/api/submit-quiz", submitQuizAnswers);

// API Routes - Leaderboards
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

if (import.meta.main) {
	app.listen(PORT, HOST, () => {
		console.log(`running on http://${HOST}:${PORT}`);
	});
}

export default app;
