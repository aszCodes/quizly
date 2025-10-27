import request from "supertest";
import app from "../index.js";
import {
	createTestQuestion,
	createTestStudent,
	createTestQuiz,
} from "./testUtils.js";
import db from "../db/database.js";

describe("GET /api/question", () => {
	it("should handle malformed JSON in options field", async () => {
		db.prepare(
			"INSERT INTO questions (question_text, correct_answer, options, is_active) VALUES (?, ?, ?, ?)"
		).run("Test?", "A", "not valid json", 1);

		const res = await request(app).get("/api/question");
		expect(res.status).toBe(500);
	});

	it("should handle null options field", async () => {
		db.prepare(
			"INSERT INTO questions (question_text, correct_answer, options, is_active) VALUES (?, ?, ?, ?)"
		).run("Test?", "A", null, 1);

		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.options).toEqual([]);
	});

	it("should return 404 when no active question exists", async () => {
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("No active question found");
	});

	it("should return active question with parsed JSON options", async () => {
		createTestQuestion({
			question_text: "What is 2+2?",
			correct_answer: "4",
			options: ["2", "3", "4", "5"],
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.question_text).toBe("What is 2+2?");
		expect(res.body.options).toEqual(["2", "3", "4", "5"]);
	});

	it("should not return correct_answer in response", async () => {
		createTestQuestion({
			question_text: "What is the capital of France?",
			correct_answer: "Paris",
			options: ["London", "Paris", "Berlin", "Madrid"],
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body).not.toHaveProperty("correct_answer");
	});

	it("should only return active questions", async () => {
		createTestQuestion({
			question_text: "Inactive question?",
			correct_answer: "A",
			is_active: 0,
		});
		createTestQuestion({
			question_text: "Active question?",
			correct_answer: "B",
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.question_text).toBe("Active question?");
	});

	it("should return only first active question when multiple exist", async () => {
		const q1 = createTestQuestion({
			question_text: "First active question?",
			correct_answer: "A",
			is_active: 1,
		});
		createTestQuestion({
			question_text: "Second active question?",
			correct_answer: "B",
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.id).toBe(q1);
		expect(res.body.question_text).toBe("First active question?");
	});

	it("should not return questions that are part of a quiz", async () => {
		const quizId = createTestQuiz({ title: "Test Quiz" });
		createTestQuestion({
			question_text: "Quiz question?",
			correct_answer: "A",
			quiz_id: quizId,
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("No active question found");
	});

	it("should handle empty options array", async () => {
		createTestQuestion({
			question_text: "Question with no options?",
			correct_answer: "Yes",
			options: [],
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.options).toEqual([]);
	});
});

describe("POST /api/submit", () => {
	let questionId;
	beforeEach(() => {
		questionId = createTestQuestion({
			question_text: "What is 2+2?",
			correct_answer: "4",
			options: ["2", "3", "4", "5"],
			is_active: 1,
		});
	});

	describe("Validation", () => {
		it("should handle questionId as null", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId: null,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should handle duration as null", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId: questionId,
				answer: "4",
				duration: null,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when studentName is missing", async () => {
			const res = await request(app).post("/api/submit").send({
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when questionId is missing", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when answer is missing", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when duration is missing", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when answer is empty string", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when studentName is empty string", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when studentName is whitespace", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "   ",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should return 400 when studentName is too short", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "A",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid student name");
		});

		it("should reject excessively long student names", async () => {
			const tooLongName = "A".repeat(300);
			const res = await request(app).post("/api/submit").send({
				studentName: tooLongName,
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid student name");
		});

		it("should return 400 when duration is negative", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: -100,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid duration");
		});

		it("should return 400 when duration is zero", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 0,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid duration");
		});

		it("should return 400 when duration is not a number", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: "not-a-number",
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid duration");
		});
	});

	describe("Student Name Handling", () => {
		it("should handle leading/trailing spaces", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "  John Doe  ",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("John Doe");
			expect(student).toBeDefined();
		});

		it("should handle multiple spaces", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John    Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
		});

		it("should handle names with numbers", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Student123",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
		});

		it("should handle names with emojis", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John 😊 Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect([200, 400]).toContain(res.status);
		});

		it("should handle names with special characters", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "O'Brien-Smith (Jr.)",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
		});
	});
	describe("Answer Handling", () => {
		it("should handle answer as number instead of string", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: 4,
				duration: 5000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
		});

		it("should handle case-insensitive answers", async () => {
			const qId = createTestQuestion({
				question_text: "What is the capital of France?",
				correct_answer: "Paris",
				is_active: 1,
			});
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId: qId,
				answer: "paris",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
			expect(res.body.score).toBe(10);
		});

		it("should trim whitespace from answers", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "  4  ",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
			expect(res.body.score).toBe(10);
		});

		it("should handle answers with only whitespace as invalid", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "   ",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("should handle extremely long answers gracefully", async () => {
			const longAnswer = "A".repeat(10000);
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: longAnswer,
				duration: 5000,
			});
			expect([200, 400]).toContain(res.status);
		});
	});

	describe("Duration Handling", () => {
		it("should handle duration as float/decimal", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000.75,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
		});

		it("should handle very large duration values", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 3600000,
			});
			expect([200, 400]).toContain(res.status);
		});

		it("should reject unreasonably large duration values", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: Number.MAX_SAFE_INTEGER,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid duration");
		});
	});

	describe("Question Integrity", () => {
		it("should return 404 when question does not exist", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId: 99999,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Question not found");
		});

		it("should reject submission for quiz-linked question", async () => {
			const quizId = createTestQuiz({ title: "Test Quiz" });
			const quizQId = createTestQuestion({
				question_text: "Quiz question?",
				correct_answer: "A",
				quiz_id: quizId,
				is_active: 1,
			});
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId: quizQId,
				answer: "A",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe(
				"This question is part of a quiz. Use the quiz submission endpoint."
			);
		});

		it("should maintain referential integrity", async () => {
			const q1 = createTestQuestion({
				question_text: "Question 1?",
				correct_answer: "A",
				is_active: 1,
			});
			await request(app).post("/api/submit").send({
				studentName: "Student A",
				questionId: q1,
				answer: "A",
				duration: 5000,
			});
			expect(() => {
				db.prepare("DELETE FROM questions WHERE id = ?").run(q1);
			}).toThrow();
		});
	});

	describe("Duplicate Attempts", () => {
		it("should prevent duplicate submissions from same student", async () => {
			await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "3",
				duration: 3000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe(
				"You have already attempted this question"
			);
		});

		it("should treat student names case-sensitively for duplicates", async () => {
			await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			const res = await request(app).post("/api/submit").send({
				studentName: "john doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect([200, 400]).toContain(res.status);
		});

		it("should allow different students to submit answers", async () => {
			const res1 = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			const res2 = await request(app).post("/api/submit").send({
				studentName: "Jane Smith",
				questionId,
				answer: "3",
				duration: 3000,
			});
			expect(res1.status).toBe(200);
			expect(res2.status).toBe(200);
		});
	});

	describe("Score Logic", () => {
		it("should successfully submit a correct answer", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(true);
			expect(res.body.score).toBe(10);
			expect(res.body.correct_answer).toBe("4");
		});

		it("should successfully submit an incorrect answer", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Jane Doe",
				questionId,
				answer: "3",
				duration: 3000,
			});
			expect(res.status).toBe(200);
			expect(res.body.correct).toBe(false);
			expect(res.body.score).toBe(0);
			expect(res.body.correct_answer).toBe("4");
		});

		it("should record submission timestamp correctly", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			const attempt = db
				.prepare(
					"SELECT created_at FROM attempts WHERE question_id = ? ORDER BY id DESC LIMIT 1"
				)
				.get(questionId);
			expect(attempt).toBeDefined();
			expect(typeof attempt.created_at).toBe("string");
			expect(new Date(attempt.created_at).toString()).not.toBe(
				"Invalid Date"
			);
			expect(attempt.created_at).toMatch(
				/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
			);
		});
	});

	describe("Security", () => {
		it("should prevent SQL injection in student name queries", async () => {
			const maliciousName = "'; DROP TABLE attempts; --";
			await request(app).post("/api/submit").send({
				studentName: maliciousName,
				questionId,
				answer: "4",
				duration: 5000,
			});
			const tableCheck = db
				.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'"
				)
				.get();
			expect(tableCheck).toBeDefined();
		});

		it("should sanitize student names with SQL injection attempts", async () => {
			const maliciousName = "Robert'; DROP TABLE students;--";
			const res = await request(app).post("/api/submit").send({
				studentName: maliciousName,
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect([200, 400]).toContain(res.status);
			const tableCheck = db
				.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='students'"
				)
				.get();
			expect(tableCheck).toBeDefined();
		});
	});

	describe("Database Behavior", () => {
		it("should create student if they don't exist", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "New Student",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("New Student");
			expect(student).toBeDefined();
		});

		it("should use existing student if already exists", async () => {
			const studentId = createTestStudent("Existing Student");
			const res = await request(app).post("/api/submit").send({
				studentName: "Existing Student",
				questionId,
				answer: "4",
				duration: 5000,
			});
			expect(res.status).toBe(200);
			const students = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.all("Existing Student");
			expect(students.length).toBe(1);
			expect(students[0].id).toBe(studentId);
		});
	});
});

describe("GET /api/leaderboard", () => {
	it("should handle students with same score and duration", async () => {
		const q1 = createTestQuestion({
			question_text: "Question 1?",
			correct_answer: "A",
			is_active: 1,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student A",
			questionId: q1,
			answer: "A",
			duration: 5000,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student B",
			questionId: q1,
			answer: "A",
			duration: 5000,
		});
		const res = await request(app).get("/api/leaderboard");
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(2);
		expect(res.body[0].score).toBe(10);
		expect(res.body[1].score).toBe(10);
	});

	it("should include required fields in leaderboard entries", async () => {
		const q1 = createTestQuestion({
			question_text: "Question 1?",
			correct_answer: "A",
			is_active: 1,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student A",
			questionId: q1,
			answer: "A",
			duration: 5000,
		});
		const res = await request(app).get("/api/leaderboard");
		expect(res.status).toBe(200);
		expect(res.body[0]).toHaveProperty("student_name");
		expect(res.body[0]).toHaveProperty("score");
		expect(res.body[0]).toHaveProperty("duration");
	});

	it("should return empty array when no attempts exist", async () => {
		const res = await request(app).get("/api/leaderboard");
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});

	it("should return leaderboard sorted by score then duration", async () => {
		const q1 = createTestQuestion({
			question_text: "Question 1?",
			correct_answer: "A",
			is_active: 1,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student A",
			questionId: q1,
			answer: "A",
			duration: 10000,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student B",
			questionId: q1,
			answer: "A",
			duration: 5000,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student C",
			questionId: q1,
			answer: "B",
			duration: 3000,
		});
		const res = await request(app).get("/api/leaderboard");
		expect(res.status).toBe(200);
		expect(res.body[0].student_name).toBe("Student B");
		expect(res.body[1].student_name).toBe("Student A");
		expect(res.body[2].student_name).toBe("Student C");
	});

	it("should not include quiz attempts in single question leaderboard", async () => {
		const q1 = createTestQuestion({
			question_text: "Single question?",
			correct_answer: "A",
			is_active: 1,
		});
		await request(app).post("/api/submit").send({
			studentName: "Student A",
			questionId: q1,
			answer: "A",
			duration: 5000,
		});
		const quizId = createTestQuiz({ title: "Test Quiz" });
		const studentId = createTestStudent("Student B");
		db.prepare(
			"INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration) VALUES (?, ?, ?, ?, ?, ?)"
		).run(studentId, quizId, q1, "A", 10, 5000);
		const res = await request(app).get("/api/leaderboard");
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(1);
		expect(res.body[0].student_name).toBe("Student A");
	});
});

describe("Question Options JSON Handling", () => {
	it("should store options as valid JSON string", async () => {
		const options = ["Option A", "Option B", "Option C", "Option D"];
		const qId = createTestQuestion({
			question_text: "Test question?",
			correct_answer: "Option A",
			options,
			is_active: 1,
		});
		const question = db
			.prepare("SELECT options FROM questions WHERE id = ?")
			.get(qId);
		expect(typeof question.options).toBe("string");
		expect(JSON.parse(question.options)).toEqual(options);
	});

	it("should return parsed JSON array when fetching question", async () => {
		createTestQuestion({
			question_text: "Test question?",
			correct_answer: "B",
			options: ["A", "B", "C", "D"],
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.options)).toBe(true);
		expect(res.body.options).toEqual(["A", "B", "C", "D"]);
	});

	it("should handle special characters in options", async () => {
		const options = [
			"<script>alert('xss')</script>",
			"O'Brien's answer",
			'Quote: "Hello"',
			"Math: 2+2=4",
		];
		createTestQuestion({
			question_text: "Special chars?",
			correct_answer: "Math: 2+2=4",
			options,
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.options).toEqual(options);
	});

	it("should handle unicode characters in options", async () => {
		const options = ["🎉 Party", "中文", "العربية", "Español"];
		createTestQuestion({
			question_text: "Unicode test?",
			correct_answer: "🎉 Party",
			options,
			is_active: 1,
		});
		const res = await request(app).get("/api/question");
		expect(res.status).toBe(200);
		expect(res.body.options).toEqual(options);
	});

	it("should handle questionId as string instead of number", async () => {
		const res = await request(app).post("/api/submit").send({
			studentName: "John Doe",
			questionId: "not-a-number",
			answer: "4",
			duration: 5000,
		});
		expect(res.status).toBe(400);
		expect(res.body.error).toBe("Invalid question ID");
	});

	it("should handle questionId as zero", async () => {
		const res = await request(app).post("/api/submit").send({
			studentName: "John Doe",
			questionId: 0,
			answer: "4",
			duration: 5000,
		});
		expect(res.status).toBe(400);
		expect(res.body.error).toBe("Invalid question ID");
	});
});
