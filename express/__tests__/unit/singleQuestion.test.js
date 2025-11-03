import request from "supertest";
import app from "../../server.js";
import {
	createTestStudent,
	createTestQuestion,
	createTestQuiz,
	addTestStudentToWhitelist,
} from "../testUtils.js";

describe("Single Question Routes", () => {
	describe("GET /api/question", () => {
		it("should return 404 when no active question exists", async () => {
			const response = await request(app).get("/api/question");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: "No active question found",
			});
		});

		it("should return active single question without correct answer", async () => {
			createTestQuestion({
				question_text: "What is 2+2?",
				correct_answer: "4",
				options: ["2", "3", "4", "5"],
				quiz_id: null,
				is_active: 1,
			});

			const response = await request(app).get("/api/question");

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: expect.any(Number),
				question_text: "What is 2+2?",
				options: ["2", "3", "4", "5"],
			});
			expect(response.body).not.toHaveProperty("correct_answer");
		});

		it("should not return inactive questions", async () => {
			createTestQuestion({
				is_active: 0,
				quiz_id: null,
			});

			const response = await request(app).get("/api/question");

			expect(response.status).toBe(404);
		});

		it("should not return quiz-linked questions", async () => {
			const quizId = createTestQuiz({ title: "Test Quiz" });
			createTestQuestion({
				is_active: 1,
				quiz_id: quizId,
			});

			const response = await request(app).get("/api/question");

			expect(response.status).toBe(404);
		});
	});

	describe("POST /api/submit", () => {
		let questionId;

		beforeEach(() => {
			questionId = createTestQuestion({
				question_text: "What is 2+2?",
				correct_answer: "4",
				options: ["2", "3", "4", "5"],
				quiz_id: null,
				is_active: 1,
			});

			// Whitelist the test student
			addTestStudentToWhitelist("John Doe", "IT - A");
		});

		describe("Validation", () => {
			it("should reject missing studentName", async () => {
				const response = await request(app).post("/api/submit").send({
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Missing required fields");
			});

			it("should reject missing section", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Section is required");
			});

			it("should reject missing questionId", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Missing required fields");
			});

			it("should reject missing answer", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Missing required fields");
			});

			it("should reject missing duration", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Missing required fields");
			});

			it("should reject student name shorter than 2 characters", async () => {
				addTestStudentToWhitelist("A", "IT - A");
				const response = await request(app).post("/api/submit").send({
					studentName: "A",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid student name");
			});

			it("should reject student name longer than 255 characters", async () => {
				const longName = "A".repeat(256);
				const response = await request(app).post("/api/submit").send({
					studentName: longName,
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid student name");
			});

			it("should reject invalid questionId (not a number)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId: "invalid",
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid question ID");
			});

			it("should reject invalid questionId (negative)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId: -1,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid question ID");
			});

			it("should reject invalid questionId (zero)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId: 0,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid question ID");
			});

			it("should reject invalid duration (not a number)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: "invalid",
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid duration");
			});

			it("should reject invalid duration (negative)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: -100,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid duration");
			});

			it("should reject invalid duration (zero)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 0,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid duration");
			});

			it("should reject duration exceeding max (1 hour)", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 3600001, // 1 hour + 1ms
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Invalid duration");
			});

			it("should reject empty section string", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "   ",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe("Section is required");
			});

			it("should reject non-whitelisted student", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "Unknown Student",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(403);
				expect(response.body.error).toBe(
					"Student not found in class roster. Please verify your name and section with your teacher."
				);
			});
		});

		describe("Answer Submission", () => {
			it("should accept correct answer and return score of 10", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body).toEqual({
					correct: true,
					score: 10,
					correct_answer: "4",
				});
			});

			it("should accept incorrect answer and return score of 0", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "5",
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body).toEqual({
					correct: false,
					score: 0,
					correct_answer: "4",
				});
			});

			it("should be case-insensitive for answers", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4", // Correct answer is "4"
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body.correct).toBe(true);
			});

			it("should trim whitespace from answers", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "  4  ",
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body.correct).toBe(true);
			});

			it("should trim whitespace from student name", async () => {
				addTestStudentToWhitelist("Jane Smith", "IT - A");
				const response = await request(app).post("/api/submit").send({
					studentName: "  Jane Smith  ",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body.correct).toBe(true);
			});

			it("should convert numeric answer to string", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: 4, // Numeric
					duration: 5000,
				});

				expect(response.status).toBe(200);
				expect(response.body.correct).toBe(true);
			});

			it("should prevent duplicate attempts for same student and question", async () => {
				// First attempt
				await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "4",
					duration: 5000,
				});

				// Second attempt
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId,
					answer: "5",
					duration: 3000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe(
					"You have already attempted this question"
				);
			});

			it("should reject quiz-linked question", async () => {
				const quizId = createTestQuiz({ title: "Test Quiz" });
				const quizQuestionId = createTestQuestion({
					question_text: "Quiz Question?",
					correct_answer: "A",
					quiz_id: quizId,
					is_active: 1,
				});

				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId: quizQuestionId,
					answer: "A",
					duration: 5000,
				});

				expect(response.status).toBe(400);
				expect(response.body.error).toBe(
					"This question is part of a quiz. Use the quiz submission endpoint."
				);
			});

			it("should return 404 for non-existent question", async () => {
				const response = await request(app).post("/api/submit").send({
					studentName: "John Doe",
					section: "IT - A",
					questionId: 99999,
					answer: "4",
					duration: 5000,
				});

				expect(response.status).toBe(404);
				expect(response.body.error).toBe("Question not found");
			});
		});
	});

	describe("GET /api/leaderboard", () => {
		it("should return empty array when no attempts exist", async () => {
			const response = await request(app).get("/api/leaderboard");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("should return leaderboard sorted by score DESC, duration ASC", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - A");
			addTestStudentToWhitelist("Charlie", "IT - A");

			const q1 = createTestQuestion({
				question_text: "Q1",
				correct_answer: "A",
				quiz_id: null,
				is_active: 1,
			});
			const q2 = createTestQuestion({
				question_text: "Q2",
				correct_answer: "B",
				quiz_id: null,
				is_active: 1,
			});
			const q3 = createTestQuestion({
				question_text: "Q3",
				correct_answer: "C",
				quiz_id: null,
				is_active: 1,
			});

			// Alice: 10 points, 2000ms
			await request(app).post("/api/submit").send({
				studentName: "Alice",
				section: "IT - A",
				questionId: q1,
				answer: "A",
				duration: 2000,
			});

			// Bob: 10 points, 3000ms (same score, slower)
			await request(app).post("/api/submit").send({
				studentName: "Bob",
				section: "IT - A",
				questionId: q2,
				answer: "B",
				duration: 3000,
			});

			// Charlie: 0 points
			await request(app).post("/api/submit").send({
				studentName: "Charlie",
				section: "IT - A",
				questionId: q3,
				answer: "Wrong",
				duration: 1000,
			});

			const response = await request(app).get("/api/leaderboard");

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(3);
			expect(response.body[0].student_name).toBe("Alice");
			expect(response.body[0].score).toBe(10);
			expect(response.body[1].student_name).toBe("Bob");
			expect(response.body[1].score).toBe(10);
			expect(response.body[2].student_name).toBe("Charlie");
			expect(response.body[2].score).toBe(0);
		});

		it("should exclude quiz attempts from leaderboard", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			const studentId = createTestStudent("Alice", "IT - A");

			const quizId = createTestQuiz({ title: "Test Quiz" });

			const singleQ = createTestQuestion({
				quiz_id: null,
				is_active: 1,
			});
			const quizQ = createTestQuestion({
				quiz_id: quizId,
				is_active: 1,
			});

			// Single question attempt (should appear)
			await request(app).post("/api/submit").send({
				studentName: "Alice",
				section: "IT - A",
				questionId: singleQ,
				answer: "A",
				duration: 2000,
			});

			const response = await request(app).get("/api/leaderboard");

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(1);
		});
	});
});
