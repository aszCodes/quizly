// db/seed.js
import db from "./database.js";

function seed() {
	console.log("Seeding database...");

	try {
		// Clear existing data
		db.prepare("DELETE FROM attempts").run();
		db.prepare("DELETE FROM questions").run();
		db.prepare("DELETE FROM students").run();
		db.prepare("DELETE FROM quizzes").run();

		// Seed students
		const insertStudent = db.prepare(
			"INSERT INTO students (name) VALUES (?)"
		);
		const students = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
		students.forEach(name => insertStudent.run(name));
		console.log("Seeded 5 students");

		// Seed a single active question (for single question mode)
		const insertQuestion = db.prepare(
			"INSERT INTO questions (question_text, correct_answer, is_active) VALUES (?, ?, ?)"
		);
		insertQuestion.run("What is the capital of France?", "Paris", 1);
		console.log("Seeded 1 active question");

		// Seed single question attempts
		const insertAttempt = db.prepare(
			"INSERT INTO attempts (student_id, question_id, student_answer, score, duration) VALUES (?, ?, ?, ?, ?)"
		);
		insertAttempt.run(1, 1, "Paris", 10, 5);
		insertAttempt.run(2, 1, "London", 0, 8);
		insertAttempt.run(3, 1, "Paris", 10, 3);
		insertAttempt.run(4, 1, "Paris", 10, 7);
		insertAttempt.run(5, 1, "Berlin", 0, 12);
		console.log("Seeded 5 single question attempts");

		// Seed a quiz
		const insertQuiz = db.prepare(
			"INSERT INTO quizzes (title, is_active) VALUES (?, ?)"
		);
		const quizResult = insertQuiz.run("Math Quiz 1", 1);
		const quizId = quizResult.lastInsertRowid;
		console.log("Seeded quiz with ID:", quizId);

		// Seed quiz questions
		const quizQuestions = [
			{ text: "What is 2 + 2?", answer: "4" },
			{ text: "What is 5 * 6?", answer: "30" },
			{ text: "What is 10 - 3?", answer: "7" },
			{ text: "What is 15 / 3?", answer: "5" },
			{ text: "What is 8 + 7?", answer: "15" },
		];

		const insertQuizQuestion = db.prepare(
			"INSERT INTO questions (question_text, correct_answer, quiz_id) VALUES (?, ?, ?)"
		);

		quizQuestions.forEach(q => {
			insertQuizQuestion.run(q.text, q.answer, quizId);
		});
		console.log("Seeded 5 quiz questions");

		// Seed quiz attempts (simulate 3 students taking the quiz)
		const insertQuizAttempt = db.prepare(
			"INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration) VALUES (?, ?, ?, ?, ?, ?)"
		);

		// Alice's attempts (all correct, fast)
		insertQuizAttempt.run(1, quizId, 2, "4", 10, 3);
		insertQuizAttempt.run(1, quizId, 3, "30", 10, 4);
		insertQuizAttempt.run(1, quizId, 4, "7", 10, 2);
		insertQuizAttempt.run(1, quizId, 5, "5", 10, 5);
		insertQuizAttempt.run(1, quizId, 6, "15", 10, 3);

		// Bob's attempts (4/5 correct, medium speed)
		insertQuizAttempt.run(2, quizId, 2, "4", 10, 5);
		insertQuizAttempt.run(2, quizId, 3, "30", 10, 6);
		insertQuizAttempt.run(2, quizId, 4, "8", 0, 10);
		insertQuizAttempt.run(2, quizId, 5, "5", 10, 7);
		insertQuizAttempt.run(2, quizId, 6, "15", 10, 5);

		// Charlie's attempts (3/5 correct, slow)
		insertQuizAttempt.run(3, quizId, 2, "5", 0, 8);
		insertQuizAttempt.run(3, quizId, 3, "30", 10, 10);
		insertQuizAttempt.run(3, quizId, 4, "7", 10, 12);
		insertQuizAttempt.run(3, quizId, 5, "5", 10, 9);
		insertQuizAttempt.run(3, quizId, 6, "14", 0, 15);

		console.log("Seeded quiz attempts for 3 students");

		console.log("\nDatabase seeded successfully!");
		console.log("\nSummary:");
		console.log("- 5 students");
		console.log("- 1 active single question");
		console.log("- 5 single question attempts");
		console.log("- 1 active quiz with 5 questions");
		console.log("- 15 quiz attempts (3 students x 5 questions)");
		console.log("\nTest endpoints:");
		console.log("- GET /api/leaderboard (single question)");
		console.log("- GET /api/quizzes/" + quizId + "/leaderboard (quiz)");
	} catch (error) {
		console.error("Seeding failed:", error);
	}
}

seed();
