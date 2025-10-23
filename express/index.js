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

// Routes
app.get("/", getHome);
app.get("/quiz", getQuiz);
app.get("/select-quiz", selectQuiz);
app.get("/admin", () => {});

// Api Routes
app.get("/api/question", getQuestion);
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

app.post("/api/submit", () => {});
app.post("/admin/question", () => {});

app.get("/quiz/:id", (req, res) => {
	const studentName = req.query.name || "Guest";
	const quizId = req.params.id;

	if (!studentName || studentName === "Guest") {
		return res.redirect("/");
	}

	res.render("quizMode", {
		title: "Quizly",
		studentName: studentName,
		quizId: quizId,
	});
});

// API routes
app.get("/api/quizzes", getActiveQuizzes);
app.get("/api/quizzes/:id/questions", getQuizQuestions);

// Handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
	console.log(`running on http://${HOST}:${PORT}`);
});

export default app;
