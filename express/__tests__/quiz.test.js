import request from "supertest";
import app from "../index.js";
import db from "../db/database.js";
import {
	createTestQuiz,
	createTestQuestion,
	createTestStudent,
} from "./testUtils.js";

describe("GET /api/quizzes", () => {
	it("returns 200 and all active quizzes", async () => {
		createTestQuiz({ title: "Active 1", is_active: 1 });
		createTestQuiz({ title: "Active 2", is_active: 1 });
		const res = await request(app).get("/api/quizzes");
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(2);
	});

	it("returns empty array when no active quizzes", async () => {
		createTestQuiz({ title: "Inactive", is_active: 0 });
		const res = await request(app).get("/api/quizzes");
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});

	it("returns quizzes ordered by newest first", async () => {
		const q1 = createTestQuiz({ title: "Old Quiz", is_active: 1 });
		const q2 = createTestQuiz({ title: "New Quiz", is_active: 1 });
		const res = await request(app).get("/api/quizzes");
		expect(res.status).toBe(200);
		expect(res.body[0].id).toBe(q2);
		expect(res.body[1].id).toBe(q1);
	});

	it("excludes sensitive fields", async () => {
		createTestQuiz({ title: "Visible", is_active: 1 });
		const res = await request(app).get("/api/quizzes");
		expect(res.status).toBe(200);
		expect(res.body[0]).not.toHaveProperty("deleted_at");
	});
});

describe("GET /api/quizzes/:id/questions", () => {
	let quizId;
	beforeEach(() => {
		quizId = createTestQuiz({ title: "Quiz Questions", is_active: 1 });
	});

	it("returns 200 and all quiz questions without correct answers", async () => {
		createTestQuestion({
			quiz_id: quizId,
			question_text: "Q1?",
			correct_answer: "A",
			options: ["A", "B", "C"],
		});
		createTestQuestion({
			quiz_id: quizId,
			question_text: "Q2?",
			correct_answer: "C",
			options: ["A", "B", "C"],
		});
		const res = await request(app).get(`/api/quizzes/${quizId}/questions`);
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(2);
		expect(res.body[0]).not.toHaveProperty("correct_answer");
	});

	it("returns 404 when quiz has no questions", async () => {
		const res = await request(app).get(`/api/quizzes/${quizId}/questions`);
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("No questions found for this quiz");
	});

	it("returns 404 for invalid quiz ID", async () => {
		const res = await request(app).get("/api/quizzes/99999/questions");
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("Quiz not found");
	});

	it("returns 400 for non-numeric quiz ID", async () => {
		const res = await request(app).get("/api/quizzes/abc/questions");
		expect(res.status).toBe(400);
		expect(res.body.error).toBe("Invalid quiz ID");
	});

	it("returns 400 for quizId as zero", async () => {
		const res = await request(app).get("/api/quizzes/0/questions");
		expect(res.status).toBe(400);
		expect(res.body.error).toBe("Invalid quiz ID");
	});
});

describe("POST /api/submit-quiz", () => {
	let quizId, q1, q2, q3;

	beforeEach(() => {
		quizId = createTestQuiz({ title: "Math Quiz", is_active: 1 });
		q1 = createTestQuestion({
			quiz_id: quizId,
			question_text: "1 + 1 = ?",
			correct_answer: "2",
			options: ["1", "2", "3"],
		});
		q2 = createTestQuestion({
			quiz_id: quizId,
			question_text: "2 + 2 = ?",
			correct_answer: "4",
			options: ["2", "3", "4"],
		});
		q3 = createTestQuestion({
			quiz_id: quizId,
			question_text: "3 + 3 = ?",
			correct_answer: "6",
			options: ["5", "6", "7"],
		});
	});

	describe("Validation", () => {
		it("returns 400 when quizId is missing", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 5000,
				});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("returns 400 when studentName is missing", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					answers: [{ questionId: q1, answer: "2" }],
					duration: 5000,
				});
			expect(res.status).toBe(400);
		});

		it("returns 400 when answers array is missing", async () => {
			const res = await request(app).post("/api/submit-quiz").send({
				quizId,
				studentName: "John",
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Missing required fields");
		});

		it("returns 400 when duration is invalid", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: -1,
				});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid duration");
		});

		it("returns 404 when quiz does not exist", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId: 9999,
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 5000,
				});
			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Quiz not found");
		});

		it("returns 400 when answers array is empty", async () => {
			const res = await request(app).post("/api/submit-quiz").send({
				quizId,
				studentName: "John",
				answers: [],
				duration: 5000,
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("No answers submitted");
		});
	});

	describe("Valid Submissions", () => {
		it("accepts all-correct answers and returns 200 with total score", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John Doe",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "4" },
						{ questionId: q3, answer: "6" },
					],
					duration: 9000,
				});
			expect(res.status).toBe(200);
			expect(res.body.totalScore).toBe(30);
			expect(res.body.correctCount).toBe(3);
		});

		it("computes mixed correct/incorrect answers accurately", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Jane",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "wrong" },
						{ questionId: q3, answer: "6" },
					],
					duration: 15000,
				});
			expect(res.status).toBe(200);
			expect(res.body.totalScore).toBe(20);
			expect(res.body.correctCount).toBe(2);
			expect(res.body.incorrectCount).toBe(1);
		});

		it("ignores invalid question IDs in answer array", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John",
					answers: [
						{ questionId: 9999, answer: "X" },
						{ questionId: q2, answer: "4" },
					],
					duration: 4000,
				});
			expect(res.status).toBe(200);
			expect(res.body.totalScore).toBe(10);
		});

		it("handles answers as numbers instead of strings", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Student",
					answers: [
						{ questionId: q1, answer: 2 },
						{ questionId: q2, answer: 4 },
						{ questionId: q3, answer: 6 },
					],
					duration: 10000,
				});
			expect(res.status).toBe(200);
			expect(res.body.totalScore).toBe(30);
		});
	});

	describe("Duplicate Protection", () => {
		it("prevents the same student from resubmitting the same quiz", async () => {
			await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 4000,
				});
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 5000,
				});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("You have already attempted this quiz");
		});

		it("allows different students to submit the same quiz", async () => {
			await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 4000,
				});
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Jane",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 5000,
				});
			expect(res.status).toBe(200);
		});
	});

	describe("Database Integrity", () => {
		it("creates new student record if not existing", async () => {
			await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "New Student",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 4000,
				});
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("New Student");
			expect(student).toBeDefined();
		});

		it("uses existing student record if already present", async () => {
			const studentId = createTestStudent("Existing Student");
			await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Existing Student",
					answers: [{ questionId: q1, answer: "2" }],
					duration: 4000,
				});
			const students = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.all("Existing Student");
			expect(students.length).toBe(1);
			expect(students[0].id).toBe(studentId);
		});

		it("stores each question attempt in the DB", async () => {
			await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "John Doe",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "4" },
					],
					duration: 8000,
				});
			const attempts = db
				.prepare("SELECT * FROM attempts WHERE quiz_id = ?")
				.all(quizId);
			expect(attempts.length).toBe(2);
			expect(attempts.every(a => a.quiz_id === quizId)).toBe(true);
		});
	});
});

describe("GET /api/quizzes/:id/leaderboard", () => {
	let quizId, q1, q2;

	beforeEach(() => {
		quizId = createTestQuiz({ title: "Leaderboard Quiz", is_active: 1 });
		q1 = createTestQuestion({
			quiz_id: quizId,
			question_text: "1 + 1 = ?",
			correct_answer: "2",
			options: ["1", "2", "3"],
		});
		q2 = createTestQuestion({
			quiz_id: quizId,
			question_text: "2 + 2 = ?",
			correct_answer: "4",
			options: ["2", "3", "4"],
		});
	});

	it("returns empty array when no attempts exist", async () => {
		const res = await request(app).get(
			`/api/quizzes/${quizId}/leaderboard`
		);
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});

	it("returns leaderboard sorted by score then duration", async () => {
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Student A",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "4" },
				],
				duration: 8000,
			});
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Student B",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "wrong" },
				],
				duration: 5000,
			});
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Student C",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "4" },
				],
				duration: 6000,
			});

		const res = await request(app).get(
			`/api/quizzes/${quizId}/leaderboard`
		);
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(3);
		expect(res.body[0].student_name).toBe("Student C");
		expect(res.body[1].student_name).toBe("Student A");
		expect(res.body[2].student_name).toBe("Student B");
	});

	it("handles ties by duration correctly", async () => {
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Fast Student",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "4" },
				],
				duration: 4000,
			});
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Slow Student",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "4" },
				],
				duration: 9000,
			});
		const res = await request(app).get(
			`/api/quizzes/${quizId}/leaderboard`
		);
		expect(res.status).toBe(200);
		expect(res.body[0].student_name).toBe("Fast Student");
	});

	it("aggregates scores correctly across all questions", async () => {
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "John Doe",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "wrong" },
				],
				duration: 8000,
			});
		const res = await request(app).get(
			`/api/quizzes/${quizId}/leaderboard`
		);
		expect(res.status).toBe(200);
		expect(res.body[0].score).toBe(10);
	});

	it("includes all required fields", async () => {
		await request(app)
			.post("/api/submit-quiz")
			.send({
				quizId,
				studentName: "Jane Doe",
				answers: [
					{ questionId: q1, answer: "2" },
					{ questionId: q2, answer: "4" },
				],
				duration: 7000,
			});
		const res = await request(app).get(
			`/api/quizzes/${quizId}/leaderboard`
		);
		expect(res.status).toBe(200);
		expect(res.body[0]).toHaveProperty("student_name");
		expect(res.body[0]).toHaveProperty("score");
		expect(res.body[0]).toHaveProperty("duration");
		expect(res.body[0]).toHaveProperty("attempts");
	});

	it("returns 404 for nonexistent quiz ID", async () => {
		const res = await request(app).get(`/api/quizzes/99999/leaderboard`);
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("Quiz not found");
	});

	it("returns 400 for non-numeric quiz ID", async () => {
		const res = await request(app).get(`/api/quizzes/abc/leaderboard`);
		expect(res.status).toBe(400);
		expect(res.body.error).toBe("Invalid quiz ID");
	});
});
