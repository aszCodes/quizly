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

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON bodies
app.use(express.json());

// FRONTEND ROUTES

// Home page
app.get("/", (req, res) => {
	res.render("home");
});

// Quiz taking page
app.get("/quiz/:id", (req, res) => {
	res.render("quiz", { quizId: req.params.id });
});

// Quiz leaderboard page
app.get("/leaderboard/:id", (req, res) => {
	res.render("leaderboard", { quizId: req.params.id });
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

// Single Questions
app.get("/api/question", getQuestion);
app.post("/api/submit", submitSingleAnswer);

// Quizzes
app.get("/api/quizzes", getActiveQuizzes);
app.get("/api/quizzes/:id/questions", getQuizQuestions);
app.post("/api/submit-quiz", submitQuizAnswers);

// Leaderboards
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

// ERROR HANDLERS

app.use(notFound);
app.use(errorHandler);

if (import.meta.main) {
	app.listen(PORT, HOST, () => {
		console.log(`running on http://${HOST}:${PORT}`);
	});
}

export default app;
