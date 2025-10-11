import { createServer } from "node:http";

const hostname = process.env.HOST;
const port = process.env.PORT;

const quiz = [
	{
		id: 1,
		title: "DSA Quiz #1",
		description: "Week 1 and Week 2 Quiz",
		timeLimit: 10,
		isActive: true,
		allowedAttempts: 1,
	},
];

const questions = [
	{
		id: 1,
		quizId: 1,
		questionText: "It is an organized way to store and manage data",
		options: ["Data Structure", "Data Type", "Data Flow"],
		correctAnswerIndex: 0,
		points: 1,
	},
];

// /api/quiz handler for GET requests
const quizHandler = (req, res) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(quiz));
};

// /api/questions handler for GET requests
const questionsHandler = (req, res) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(questions));
};

const server = createServer((req, res) => {
	if (req.url === "/api/quiz") {
		quizHandler(req, res);
	} else if (req.url === "/api/questions") {
		questionsHandler(req, res);
	} else {
		res.statusCode = 404;
		res.setHeader("Content-Type", "text/plain");
		res.end("Not Found");
	}
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
