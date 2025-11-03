import request from "supertest";
import app from "../../server.js";
import {
	createTestQuiz,
	createTestQuestion,
	addTestStudentToWhitelist,
} from "../testUtils.js";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe("Quiz Routes", () => {
	describe("GET /api/quizzes", () => {
		test("should return empty array when no active quizzes", async () => {
			const res = await request(app).get("/api/quizzes");

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		test("should return only active quizzes", async () => {
			createTestQuiz({ title: "Active Quiz", is_active: 1 });
			createTestQuiz({ title: "Inactive Quiz", is_active: 0 });

			const res = await request(app).get("/api/quizzes");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
			expect(res.body[0].title).toBe("Active Quiz");
		});

		test("should return quizzes ordered by newest first", async () => {
			const quiz1 = createTestQuiz({ title: "First Quiz" });
			const quiz2 = createTestQuiz({ title: "Second Quiz" });

			const res = await request(app).get("/api/quizzes");

			expect(res.status).toBe(200);
			expect(res.body[0].id).toBe(quiz2);
			expect(res.body[1].id).toBe(quiz1);
		});
	});

	describe("POST /api/quizzes/:id/start", () => {
		let quizId, questionId;

		beforeEach(() => {
			quizId = createTestQuiz({ title: "Test Quiz" });
			questionId = createTestQuestion({
				quiz_id: quizId,
				question_text: "Test?",
			});
			addTestStudentToWhitelist("John Doe", "IT - A");
		});

		test("should start quiz session successfully", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "John Doe",
					section: "IT - A",
				});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("sessionToken");
			expect(res.body).toHaveProperty("question");
			expect(res.body.question).toHaveProperty("id");
			expect(res.body.question).toHaveProperty("question_text");
			expect(res.body.question).toHaveProperty("options");
			expect(res.body.question).not.toHaveProperty("correct_answer");
			expect(res.body.totalQuestions).toBe(1);
			expect(res.body.currentIndex).toBe(0);
		});

		test("should reject invalid quiz ID", async () => {
			const res = await request(app)
				.post("/api/quizzes/invalid/start")
				.send({
					studentName: "John Doe",
					section: "IT - A",
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid quiz ID");
		});

		test("should reject missing student name", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({ section: "IT - A" });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid student name");
		});

		test("should reject student name too short", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "A",
					section: "IT - A",
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid student name");
		});

		test("should reject missing section", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({ studentName: "John Doe" });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Section is required");
		});

		test("should reject non-whitelisted student", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "Unknown Student",
					section: "IT - A",
				});

			expect(res.status).toBe(403);
			expect(res.body.error).toContain("not found in class roster");
		});

		test("should reject non-existent quiz", async () => {
			const res = await request(app)
				.post("/api/quizzes/9999/start")
				.send({
					studentName: "John Doe",
					section: "IT - A",
				});

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Quiz not found");
		});

		test("should reject quiz with no questions", async () => {
			const emptyQuiz = createTestQuiz({ title: "Empty Quiz" });

			const res = await request(app)
				.post(`/api/quizzes/${emptyQuiz}/start`)
				.send({
					studentName: "John Doe",
					section: "IT - A",
				});

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("No questions found for this quiz");
		});

		test("should prevent duplicate attempts", async () => {
			// First attempt
			await request(app).post(`/api/quizzes/${quizId}/start`).send({
				studentName: "John Doe",
				section: "IT - A",
			});

			// Second attempt
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "John Doe",
					section: "IT - A",
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("You have already attempted this quiz");
		});
	});

	describe("POST /api/quizzes/:id/answer", () => {
		let quizId, questionId, sessionToken;

		beforeEach(async () => {
			quizId = createTestQuiz({ title: "Test Quiz" });
			questionId = createTestQuestion({
				quiz_id: quizId,
				question_text: "Test?",
				correct_answer: "A",
			});
			addTestStudentToWhitelist("Jane Smith", "IT - A");

			const startRes = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "Jane Smith",
					section: "IT - A",
				});

			sessionToken = startRes.body.sessionToken;
		});

		test("should submit correct answer successfully", async () => {
			await delay(1100);
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken,
					questionId,
					answer: "A",
				});

			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
			expect(res.body.score).toBe(1);
			expect(res.body.completed).toBe(true);
			expect(res.body.results).toBeDefined();
		});

		test("should submit incorrect answer", async () => {
			await delay(1100);
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken,
					questionId,
					answer: "B",
				});

			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(false);
			expect(res.body.score).toBe(0);
		});

		test("should reject missing fields", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({ sessionToken });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		test("should reject invalid session token", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken: "invalid-token",
					questionId,
					answer: "A",
				});

			expect(res.status).toBe(401);
			expect(res.body.error).toBe("Invalid session token");
		});

		test("should reject wrong question ID", async () => {
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken,
					questionId: 9999,
					answer: "A",
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Question ID mismatch");
		});

		test("should reject duplicate answer submission", async () => {
			// First submission
			await delay(1100);
			await request(app).post(`/api/quizzes/${quizId}/answer`).send({
				sessionToken,
				questionId,
				answer: "A",
			});

			// Second submission
			const res = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken,
					questionId,
					answer: "A",
				});

			expect(res.status).toBe(401);
			expect(res.body.error).toBe("Session expired or completed");
		});

		test("should handle multi-question quiz", async () => {
			const question2Id = createTestQuestion({
				quiz_id: quizId,
				question_text: "Test 2?",
				correct_answer: "B",
			});

			addTestStudentToWhitelist("Bob Johnson", "IT - A");

			// Start new session
			const startRes = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "Bob Johnson",
					section: "IT - A",
				});

			const token = startRes.body.sessionToken;
			const firstQ = startRes.body.question.id;

			await delay(1100);

			// Answer first question
			const res1 = await request(app)
				.post(`/api/quizzes/${quizId}/answer`)
				.send({
					sessionToken: token,
					questionId: firstQ,
					answer: "A",
				});

			expect(res1.status).toBe(200);
			expect(res1.body.completed).toBe(false);
			expect(res1.body.nextQuestion).toBeDefined();
		});
	});

	describe("GET /api/quizzes/:id/current", () => {
		let quizId, sessionToken;

		beforeEach(async () => {
			quizId = createTestQuiz({ title: "Test Quiz" });
			createTestQuestion({
				quiz_id: quizId,
				question_text: "Test?",
			});
			addTestStudentToWhitelist("Alice Brown", "IT - A");

			const startRes = await request(app)
				.post(`/api/quizzes/${quizId}/start`)
				.send({
					studentName: "Alice Brown",
					section: "IT - A",
				});

			sessionToken = startRes.body.sessionToken;
		});

		test("should get current question", async () => {
			const res = await request(app)
				.get(`/api/quizzes/${quizId}/current`)
				.query({ sessionToken });

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("question");
			expect(res.body).toHaveProperty("currentIndex");
			expect(res.body).toHaveProperty("totalQuestions");
		});

		test("should reject missing session token", async () => {
			const res = await request(app).get(
				`/api/quizzes/${quizId}/current`
			);

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing session token");
		});

		test("should reject invalid quiz ID", async () => {
			const res = await request(app)
				.get("/api/quizzes/invalid/current")
				.query({ sessionToken });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid quiz ID");
		});
	});

	describe("GET /api/quizzes/:id/leaderboard", () => {
		let quizId;

		beforeEach(() => {
			quizId = createTestQuiz({ title: "Test Quiz" });
		});

		test("should return empty leaderboard for quiz with no attempts", async () => {
			const res = await request(app).get(
				`/api/quizzes/${quizId}/leaderboard`
			);

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		test("should reject invalid quiz ID", async () => {
			const res = await request(app).get(
				"/api/quizzes/invalid/leaderboard"
			);

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid quiz ID");
		});

		test("should reject non-existent quiz", async () => {
			const res = await request(app).get("/api/quizzes/9999/leaderboard");

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Quiz not found");
		});
	});
});
