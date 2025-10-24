import express from "express";
import path from "node:path";
import notFound from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import { getHome } from "./controllers/index.js";
import { getQuiz, selectQuiz } from "./controllers/quiz.js";
import getQuestion from "./controllers/api/questions.js";
import getSingleLeaderboard from "./controllers/api/singleLeaderboard.js";
import {
	getQuizLeaderboard,
	getActiveQuizzes,
	getQuizQuestions,
} from "./controllers/api/quiz.js";
import {
	submitSingleAnswer,
	submitQuizAnswers,
} from "./controllers/api/submit.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

const app = express();

const __dirname = path.dirname(import.meta.filename);

// Set default template engine to "ejs"
app.set("view engine", "ejs");

// Set views
app.set("views", path.join(__dirname, "views"));

// Set static files
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON bodies
app.use(express.json());

// View Routes
app.get("/", getHome);
app.get("/quiz", getQuiz);
app.get("/select-quiz", selectQuiz);

app.get("/quiz/:id", (req, res) => {
	const studentName = req.query.name || "Guest";
	const quizId = req.params.id;

	// Validate student name
	if (!studentName || studentName.trim() === "" || studentName === "Guest") {
		return res.redirect("/");
	}

	// Validate quiz ID
	const parsedQuizId = parseInt(quizId, 10);
	if (isNaN(parsedQuizId) || parsedQuizId <= 0) {
		return res.status(400).render("404", {
			url: req.originalUrl,
		});
	}

	res.render("quizMode", {
		title: "Quizly",
		studentName: studentName.trim(),
		quizId: parsedQuizId,
	});
});

// API Routes - Questions
app.get("/api/question", getQuestion);
app.get("/api/quizzes", getActiveQuizzes);
app.get("/api/quizzes/:id/questions", getQuizQuestions);

// API Routes - Submissions
app.post("/api/submit", submitSingleAnswer);
app.post("/api/submit-quiz", submitQuizAnswers);

// API Routes - Leaderboards
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

// Future routes
// app.get("/admin", adminController);
// app.post("/admin/question", createQuestionController);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
	console.log(`running on http://${HOST}:${PORT}`);
});

export default app;
