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
		const students = [
			"Alice",
			"Bob",
			"Charlie",
			"Diana",
			"Eve",
			"Frank",
			"Grace",
			"Henry",
		];
		students.forEach(name => insertStudent.run(name));
		console.log(`Seeded ${students.length} students`);

		// Seed single active question (for single question mode)
		const insertQuestion = db.prepare(
			"INSERT INTO questions (question_text, correct_answer, is_active) VALUES (?, ?, ?)"
		);
		insertQuestion.run("What is the capital of France?", "Paris", 1);
		console.log("Seeded 1 active single question");

		// Seed single question attempts
		const insertAttempt = db.prepare(
			"INSERT INTO attempts (student_id, question_id, student_answer, score, duration) VALUES (?, ?, ?, ?, ?)"
		);
		insertAttempt.run(1, 1, "Paris", 10, 5);
		insertAttempt.run(2, 1, "London", 0, 8);
		insertAttempt.run(3, 1, "Paris", 10, 3);
		insertAttempt.run(4, 1, "Paris", 10, 7);
		insertAttempt.run(5, 1, "Berlin", 0, 12);
		insertAttempt.run(6, 1, "Paris", 10, 4);
		insertAttempt.run(7, 1, "Rome", 0, 15);
		console.log("Seeded single question attempts");

		// ========================================
		// SEED QUIZZES WITH MULTIPLE CHOICE
		// ========================================

		const insertQuiz = db.prepare(
			"INSERT INTO quizzes (title, is_active) VALUES (?, ?)"
		);

		// Quiz 1: General Knowledge
		const quiz1 = insertQuiz.run("General Knowledge Quiz", 1);
		const quiz1Id = quiz1.lastInsertRowid;
		console.log("Created Quiz 1: General Knowledge");

		const generalKnowledgeQuestions = [
			{
				text: "What is the largest planet in our solar system?",
				answer: "Jupiter",
			},
			{ text: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
			{ text: "What is the chemical symbol for gold?", answer: "Au" },
			{ text: "In which year did World War II end?", answer: "1945" },
			{ text: "What is the smallest prime number?", answer: "2" },
		];

		// Quiz 2: Math Quiz
		const quiz2 = insertQuiz.run("Math Challenge", 1);
		const quiz2Id = quiz2.lastInsertRowid;
		console.log("Created Quiz 2: Math Challenge");

		const mathQuestions = [
			{ text: "What is 15 × 8?", answer: "120" },
			{ text: "What is the square root of 144?", answer: "12" },
			{ text: "What is 25% of 200?", answer: "50" },
			{ text: "What is 7³ (7 cubed)?", answer: "343" },
			{
				text: "What is the value of π (pi) rounded to 2 decimal places?",
				answer: "3.14",
			},
		];

		// Quiz 3: Science Quiz
		const quiz3 = insertQuiz.run("Science Trivia", 1);
		const quiz3Id = quiz3.lastInsertRowid;
		console.log("Created Quiz 3: Science Trivia");

		const scienceQuestions = [
			{ text: "What is the speed of light?", answer: "299,792,458 m/s" },
			{
				text: "What is the most abundant gas in Earth's atmosphere?",
				answer: "Nitrogen",
			},
			{
				text: "What is the powerhouse of the cell?",
				answer: "Mitochondria",
			},
			{ text: "What is H2O commonly known as?", answer: "Water" },
			{
				text: "How many bones are in the adult human body?",
				answer: "206",
			},
		];

		// Quiz 4: Geography Quiz
		const quiz4 = insertQuiz.run("World Geography", 0); // Inactive
		const quiz4Id = quiz4.lastInsertRowid;
		console.log("Created Quiz 4: World Geography (inactive)");

		const geographyQuestions = [
			{ text: "What is the longest river in the world?", answer: "Nile" },
			{
				text: "Which continent is the Sahara Desert located in?",
				answer: "Africa",
			},
			{
				text: "What is the smallest country in the world?",
				answer: "Vatican City",
			},
			{ text: "How many continents are there?", answer: "7" },
			{
				text: "What is the tallest mountain in the world?",
				answer: "Mount Everest",
			},
		];

		// Insert all quiz questions
		const insertQuizQuestion = db.prepare(
			"INSERT INTO questions (question_text, correct_answer, quiz_id) VALUES (?, ?, ?)"
		);

		let questionId = 2; // Start from 2 (1 is the single question)

		// Insert Quiz 1 questions
		generalKnowledgeQuestions.forEach(q => {
			insertQuizQuestion.run(q.text, q.answer, quiz1Id);
		});

		// Insert Quiz 2 questions
		mathQuestions.forEach(q => {
			insertQuizQuestion.run(q.text, q.answer, quiz2Id);
		});

		// Insert Quiz 3 questions
		scienceQuestions.forEach(q => {
			insertQuizQuestion.run(q.text, q.answer, quiz3Id);
		});

		// Insert Quiz 4 questions
		geographyQuestions.forEach(q => {
			insertQuizQuestion.run(q.text, q.answer, quiz4Id);
		});

		console.log("Seeded all quiz questions");

		// ========================================
		// SEED QUIZ ATTEMPTS
		// ========================================

		const insertQuizAttempt = db.prepare(
			"INSERT INTO attempts (student_id, quiz_id, question_id, student_answer, score, duration) VALUES (?, ?, ?, ?, ?, ?)"
		);

		// Simulate attempts for Quiz 1 (General Knowledge)
		// Alice - perfect score, fast
		insertQuizAttempt.run(1, quiz1Id, 2, "Jupiter", 10, 4);
		insertQuizAttempt.run(1, quiz1Id, 3, "Leonardo da Vinci", 10, 6);
		insertQuizAttempt.run(1, quiz1Id, 4, "Au", 10, 3);
		insertQuizAttempt.run(1, quiz1Id, 5, "1945", 10, 5);
		insertQuizAttempt.run(1, quiz1Id, 6, "2", 10, 2);

		// Bob - 4/5 correct
		insertQuizAttempt.run(2, quiz1Id, 2, "Jupiter", 10, 7);
		insertQuizAttempt.run(2, quiz1Id, 3, "Picasso", 0, 8);
		insertQuizAttempt.run(2, quiz1Id, 4, "Au", 10, 5);
		insertQuizAttempt.run(2, quiz1Id, 5, "1945", 10, 6);
		insertQuizAttempt.run(2, quiz1Id, 6, "2", 10, 4);

		// Charlie - 3/5 correct
		insertQuizAttempt.run(3, quiz1Id, 2, "Saturn", 0, 10);
		insertQuizAttempt.run(3, quiz1Id, 3, "Leonardo da Vinci", 10, 12);
		insertQuizAttempt.run(3, quiz1Id, 4, "Au", 10, 8);
		insertQuizAttempt.run(3, quiz1Id, 5, "1944", 0, 15);
		insertQuizAttempt.run(3, quiz1Id, 6, "2", 10, 5);

		// Simulate attempts for Quiz 2 (Math)
		// Diana - perfect score
		insertQuizAttempt.run(4, quiz2Id, 7, "120", 10, 3);
		insertQuizAttempt.run(4, quiz2Id, 8, "12", 10, 2);
		insertQuizAttempt.run(4, quiz2Id, 9, "50", 10, 4);
		insertQuizAttempt.run(4, quiz2Id, 10, "343", 10, 6);
		insertQuizAttempt.run(4, quiz2Id, 11, "3.14", 10, 3);

		// Eve - 3/5 correct
		insertQuizAttempt.run(5, quiz2Id, 7, "120", 10, 5);
		insertQuizAttempt.run(5, quiz2Id, 8, "12", 10, 4);
		insertQuizAttempt.run(5, quiz2Id, 9, "25", 0, 10);
		insertQuizAttempt.run(5, quiz2Id, 10, "243", 0, 12);
		insertQuizAttempt.run(5, quiz2Id, 11, "3.14", 10, 6);

		console.log("Seeded quiz attempts");

		console.log("\n" + "=".repeat(50));
		console.log("DATABASE SEEDED SUCCESSFULLY!");
		console.log("=".repeat(50));
		console.log("\n📊 Summary:");
		console.log(`  • ${students.length} students`);
		console.log(`  • 1 active single question`);
		console.log(`  • 4 quizzes (3 active, 1 inactive)`);
		console.log(`  • 20 quiz questions total`);
		console.log(`  • Multiple attempts logged`);

		console.log("\n🧪 Test Endpoints:");
		console.log(`  • GET /api/leaderboard (single question)`);
		console.log(
			`  • GET /api/quizzes/${quiz1Id}/leaderboard (General Knowledge)`
		);
		console.log(
			`  • GET /api/quizzes/${quiz2Id}/leaderboard (Math Challenge)`
		);
		console.log(
			`  • GET /api/quizzes/${quiz3Id}/leaderboard (Science Trivia)`
		);
		console.log("\n");
	} catch (error) {
		console.error("❌ Seeding failed:", error);
	}
}

seed();
