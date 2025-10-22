import express from "express";
import path from "node:path";
import notFound from "./middlewares/notFound.js";
import { getHome } from "./controllers/index.js";
import getQuestions from "./controllers/api/questions.js";
import getAttempts from "./controllers/api/attempts.js";

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
app.get("/api/attempts", getAttempts);

app.post("/api/submit", () => {});
app.post("/admin/question", () => {});

// 404 handler
app.use(notFound);

app.listen(PORT, HOST, () => {
	console.log(`running on http://${HOST}:${PORT}`);
});

export default app;
