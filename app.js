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
	},
];

const attempts = [
	{
		id: "2023-10-11T10:40:00Z",
		quizId: 1,
		studentName: "John Doe",
		answers: [0, 2, 1, 0, 3],
		totalQuestions: 1,
		completedAt: "2023-10-11T10:50:00Z",
	},
];

// api/quiz handler for GET requests
const quizHandler = (req, res) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(quiz));
};

// api/questions handler for GET requests
const questionsHandler = (req, res) => {
	const safeQuestions = questions.map((q) => ({
		id: q.id,
		quizId: q.quizId,
		questionText: q.questionText,
		options: q.options,
	}));

	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(safeQuestions));
};

// api/submit handler for POST requests
const submitQuizHandler = (req, res) => {
	let body = "";

	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		try {
			const { studentName, answers, quizId } = JSON.parse(body);

			// Validate input
			if (!studentName || !answers || !quizId) {
				res.statusCode = 400;
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ error: "Missing required fields" }));
				return;
			}

			// Get questions for this quiz
			const quizQuestions = questions.filter((q) => q.quizId === quizId);

			// Calculate score
			let score = 0;
			answers.forEach((selectedIndex, index) => {
				if (
					quizQuestions[index] &&
					selectedIndex === quizQuestions[index].correctAnswerIndex
				) {
					score++;
				}
			});

			const totalQuestions = quizQuestions.length;
			const percentage = Math.round((score / totalQuestions) * 100);

			// Store attempt
			const attempt = {
				id: Date.now(),
				quizId,
				studentName,
				answers,
				score,
				totalQuestions,
				completedAt: new Date().toISOString(),
			};

			attempts.push(attempt);

			// Send response
			res.statusCode = 200;
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					score,
					totalQuestions,
					percentage,
				})
			);
		} catch (error) {
			res.statusCode = 400;
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ error: "Invalid request" }));
		}
	});
};

const server = createServer((req, res) => {
	if (req.url === "/api/quiz" && req.method === "GET") {
		quizHandler(req, res);
	} else if (req.url === "/api/questions") {
		questionsHandler(req, res && req.method === "GET");
	} else if (req.url === "/api/submit" && req.method === "POST") {
		submitQuizHandler(req, res && req.method === "POST");
	} else {
		res.statusCode = 404;
		res.setHeader("Content-Type", "text/plain");
		res.end("Not Found");
	}
});

server
	.listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	})
	.on("error", (err) => {
		console.error("Server error:", err);
	});
