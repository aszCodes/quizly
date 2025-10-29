import request from "supertest";
import app from "../index.js";
import db from "../db/database.js";
import {
	createTestQuiz,
	createTestQuestion,
	createTestStudent,
} from "./testUtils.js";

describe("Section Support", () => {
	describe("POST /api/submit - Single Question with Section", () => {
		let questionId;

		beforeEach(() => {
			questionId = createTestQuestion({
				question_text: "What is 2+2?",
				correct_answer: "4",
				options: ["2", "3", "4", "5"],
				is_active: 1,
			});
		});

		it("should store student section when provided", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "John Doe",
				section: "Section A",
				questionId,
				answer: "4",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("John Doe");
			expect(student.section).toBe("Section A");
		});

		it("should store null section when not provided", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Jane Doe",
				questionId,
				answer: "4",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Jane Doe");
			expect(student.section).toBeNull();
		});

		it("should treat empty section string as null", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Bob Smith",
				section: "",
				questionId,
				answer: "4",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Bob Smith");
			expect(student.section).toBeNull();
		});

		it("should trim section whitespace", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Alice Johnson",
				section: "  Section B  ",
				questionId,
				answer: "4",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Alice Johnson");
			expect(student.section).toBe("Section B");
		});

		it("should handle special characters in section names", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Carlos Martinez",
				section: "Section A-1 (Morning)",
				questionId,
				answer: "4",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Carlos Martinez");
			expect(student.section).toBe("Section A-1 (Morning)");
		});

		it("should allow different students in same section", async () => {
			const q1 = createTestQuestion({
				question_text: "Question 1?",
				correct_answer: "A",
				is_active: 1,
			});

			await request(app).post("/api/submit").send({
				studentName: "Student 1",
				section: "Section A",
				questionId: q1,
				answer: "A",
				duration: 5000,
			});

			await request(app).post("/api/submit").send({
				studentName: "Student 2",
				section: "Section A",
				questionId: q1,
				answer: "A",
				duration: 4000,
			});

			const students = db
				.prepare("SELECT * FROM students WHERE section = ?")
				.all("Section A");
			expect(students.length).toBe(2);
		});

		it("should use existing student record with section", async () => {
			const studentId = createTestStudent(
				"Existing Student",
				"Section C"
			);

			const res = await request(app).post("/api/submit").send({
				studentName: "Existing Student",
				section: "Section C",
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
			expect(students[0].section).toBe("Section C");
		});
	});

	describe("POST /api/submit-quiz - Quiz with Section", () => {
		let quizId, q1, q2;

		beforeEach(() => {
			quizId = createTestQuiz({ title: "Section Quiz", is_active: 1 });
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

		it("should store student section when submitting quiz", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Quiz Student",
					section: "Section D",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "4" },
					],
					duration: 9000,
				});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Quiz Student");
			expect(student.section).toBe("Section D");
		});

		it("should handle quiz submission without section", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "No Section Student",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "4" },
					],
					duration: 9000,
				});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("No Section Student");
			expect(student.section).toBeNull();
		});

		it("should reject empty section in quiz submission", async () => {
			const res = await request(app)
				.post("/api/submit-quiz")
				.send({
					quizId,
					studentName: "Empty Section Student",
					section: "   ",
					answers: [
						{ questionId: q1, answer: "2" },
						{ questionId: q2, answer: "4" },
					],
					duration: 9000,
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid section");
		});
	});

	describe("Section Leaderboard Queries", () => {
		let questionId;

		beforeEach(() => {
			questionId = createTestQuestion({
				question_text: "Test Question?",
				correct_answer: "A",
				is_active: 1,
			});
		});

		it("should filter leaderboard by section", async () => {
			// Submit answers from different sections
			await request(app).post("/api/submit").send({
				studentName: "Section A Student 1",
				section: "Section A",
				questionId,
				answer: "A",
				duration: 5000,
			});

			await request(app)
				.post("/api/submit")
				.send({
					studentName: "Section A Student 2",
					section: "Section A",
					questionId: createTestQuestion({
						question_text: "Q2?",
						correct_answer: "B",
						is_active: 1,
					}),
					answer: "B",
					duration: 4000,
				});

			await request(app)
				.post("/api/submit")
				.send({
					studentName: "Section B Student",
					section: "Section B",
					questionId: createTestQuestion({
						question_text: "Q3?",
						correct_answer: "C",
						is_active: 1,
					}),
					answer: "C",
					duration: 3000,
				});

			// Query all students by section
			const sectionAStudents = db
				.prepare("SELECT * FROM students WHERE section = ?")
				.all("Section A");

			expect(sectionAStudents.length).toBe(2);
			expect(sectionAStudents.every(s => s.section === "Section A")).toBe(
				true
			);
		});

		it("should count students per section", async () => {
			const q1 = createTestQuestion({
				question_text: "Q1?",
				correct_answer: "A",
				is_active: 1,
			});

			// Create students in different sections
			for (let i = 1; i <= 3; i++) {
				await request(app)
					.post("/api/submit")
					.send({
						studentName: `Section A Student ${i}`,
						section: "Section A",
						questionId: q1,
						answer: "A",
						duration: 5000,
					});
			}

			for (let i = 1; i <= 2; i++) {
				await request(app)
					.post("/api/submit")
					.send({
						studentName: `Section B Student ${i}`,
						section: "Section B",
						questionId: q1,
						answer: "A",
						duration: 5000,
					});
			}

			const sectionCounts = db
				.prepare(
					`
				SELECT section, COUNT(*) as count
				FROM students
				WHERE section IS NOT NULL
				GROUP BY section
				ORDER BY section
			`
				)
				.all();

			expect(sectionCounts.length).toBe(2);
			expect(sectionCounts[0].section).toBe("Section A");
			expect(sectionCounts[0].count).toBe(3);
			expect(sectionCounts[1].section).toBe("Section B");
			expect(sectionCounts[1].count).toBe(2);
		});
	});

	describe("Section Edge Cases", () => {
		let questionId;

		beforeEach(() => {
			questionId = createTestQuestion({
				question_text: "Edge Case Question?",
				correct_answer: "A",
				is_active: 1,
			});
		});

		it("should handle very long section names", async () => {
			const longSection = "Section " + "A".repeat(200);
			const res = await request(app).post("/api/submit").send({
				studentName: "Long Section Student",
				section: longSection,
				questionId,
				answer: "A",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Long Section Student");
			expect(student.section).toBe(longSection);
		});

		it("should handle numeric section names", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Numeric Section Student",
				section: "101",
				questionId,
				answer: "A",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Numeric Section Student");
			expect(student.section).toBe("101");
		});

		it("should handle unicode characters in section names", async () => {
			const res = await request(app).post("/api/submit").send({
				studentName: "Unicode Section Student",
				section: "Sección 中文 🎓",
				questionId,
				answer: "A",
				duration: 5000,
			});

			expect(res.status).toBe(200);
			const student = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Unicode Section Student");
			expect(student.section).toBe("Sección 中文 🎓");
		});

		it("should treat section as case-sensitive", async () => {
			const q1 = createTestQuestion({
				question_text: "Case Q1?",
				correct_answer: "A",
				is_active: 1,
			});

			const q2 = createTestQuestion({
				question_text: "Case Q2?",
				correct_answer: "B",
				is_active: 1,
			});

			await request(app).post("/api/submit").send({
				studentName: "Student Lowercase",
				section: "section a",
				questionId: q1,
				answer: "A",
				duration: 5000,
			});

			await request(app).post("/api/submit").send({
				studentName: "Student Uppercase",
				section: "SECTION A",
				questionId: q2,
				answer: "B",
				duration: 5000,
			});

			const lowercaseStudent = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Student Lowercase");
			const uppercaseStudent = db
				.prepare("SELECT * FROM students WHERE name = ?")
				.get("Student Uppercase");

			expect(lowercaseStudent.section).toBe("section a");
			expect(uppercaseStudent.section).toBe("SECTION A");
			expect(lowercaseStudent.section).not.toBe(uppercaseStudent.section);
		});
	});
});
