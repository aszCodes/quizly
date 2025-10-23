import express from "express";
import path from "node:path";
import notFound from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import { getHome } from "./controllers/index.js";
import getQuestions from "./controllers/api/questions.js";
import getSingleLeaderboard from "./controllers/api/singleLeaderboard.js";
import getQuizLeaderboard from "./controllers/api/quizLeaderboard.js";

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

// Routes
app.get("/", getHome);
app.get("/admin", () => {});

// Api Routes
app.get("/api/questions", getQuestions);
app.get("/api/leaderboard", getSingleLeaderboard);
app.get("/api/quizzes/:id/leaderboard", getQuizLeaderboard);

app.post("/api/submit", () => {});
app.post("/admin/question", () => {});

// Handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
	console.log(`running on http://${HOST}:${PORT}`);
});

export default app;
