import express from "express";
import path from "node:path";
import getHome from "./controllers/index.js";

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

// Assume 404 since no middleware responded
app.use((req, res, next) => {
	res.status(404).render("404", { url: req.originalUrl });
});

app.listen(PORT, HOST, () => {
	console.log(`running on http://${HOST}:${PORT}`);
});

export default app;
