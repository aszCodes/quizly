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
			"INSERT INTO questions (question_text, correct_answer, options, is_active) VALUES (?, ?, ?, ?)"
		);

		const singleQuestionOptions = JSON.stringify([
			"Paris",
			"London",
			"Berlin",
			"Madrid",
		]);

		insertQuestion.run(
			"What is the capital of France?",
			"Paris",
			singleQuestionOptions,
			1
		);
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
				options: ["Jupiter", "Saturn", "Neptune", "Uranus"],
			},
			{
				text: "Who painted the Mona Lisa?",
				answer: "Leonardo da Vinci",
				options: [
					"Leonardo da Vinci",
					"Michelangelo",
					"Raphael",
					"Donatello",
				],
			},
			{
				text: "What is the chemical symbol for gold?",
				answer: "Au",
				options: ["Au", "Ag", "Fe", "Cu"],
			},
			{
				text: "In which year did World War II end?",
				answer: "1945",
				options: ["1943", "1944", "1945", "1946"],
			},
			{
				text: "What is the smallest prime number?",
				answer: "2",
				options: ["1", "2", "3", "5"],
			},
		];

		// Quiz 2: Math Quiz
		const quiz2 = insertQuiz.run("Math Challenge", 1);
		const quiz2Id = quiz2.lastInsertRowid;
		console.log("Created Quiz 2: Math Challenge");

		const mathQuestions = [
			{
				text: "What is 15 × 8?",
				answer: "120",
				options: ["100", "110", "120", "130"],
			},
			{
				text: "What is the square root of 144?",
				answer: "12",
				options: ["10", "11", "12", "13"],
			},
			{
				text: "What is 25% of 200?",
				answer: "50",
				options: ["25", "40", "50", "75"],
			},
			{
				text: "What is 7³ (7 cubed)?",
				answer: "343",
				options: ["243", "343", "423", "443"],
			},
			{
				text: "What is the value of π (pi) rounded to 2 decimal places?",
				answer: "3.14",
				options: ["3.12", "3.14", "3.16", "3.18"],
			},
		];

		// Quiz 3: Science Quiz
		const quiz3 = insertQuiz.run("Science Trivia", 1);
		const quiz3Id = quiz3.lastInsertRowid;
		console.log("Created Quiz 3: Science Trivia");

		const scienceQuestions = [
			{
				text: "What is the speed of light?",
				answer: "299,792,458 m/s",
				options: [
					"299,792,458 m/s",
					"300,000,000 m/s",
					"186,282 miles/s",
					"150,000,000 m/s",
				],
			},
			{
				text: "What is the most abundant gas in Earth's atmosphere?",
				answer: "Nitrogen",
				options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
			},
			{
				text: "What is the powerhouse of the cell?",
				answer: "Mitochondria",
				options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
			},
			{
				text: "What is H2O commonly known as?",
				answer: "Water",
				options: ["Hydrogen", "Oxygen", "Water", "Hydrogen Peroxide"],
			},
			{
				text: "How many bones are in the adult human body?",
				answer: "206",
				options: ["196", "206", "216", "226"],
			},
		];

		// Quiz 4: Geography Quiz
		const quiz4 = insertQuiz.run("World Geography", 0); // Inactive
		const quiz4Id = quiz4.lastInsertRowid;
		console.log("Created Quiz 4: World Geography (inactive)");

		const geographyQuestions = [
			{
				text: "What is the longest river in the world?",
				answer: "Nile",
				options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
			},
			{
				text: "Which continent is the Sahara Desert located in?",
				answer: "Africa",
				options: ["Asia", "Africa", "Australia", "South America"],
			},
			{
				text: "What is the smallest country in the world?",
				answer: "Vatican City",
				options: [
					"Monaco",
					"Vatican City",
					"San Marino",
					"Liechtenstein",
				],
			},
			{
				text: "How many continents are there?",
				answer: "7",
				options: ["5", "6", "7", "8"],
			},
			{
				text: "What is the tallest mountain in the world?",
				answer: "Mount Everest",
				options: [
					"K2",
					"Mount Everest",
					"Kangchenjunga",
					"Mount Kilimanjaro",
				],
			},
		];

		// Insert all quiz questions
		const insertQuizQuestion = db.prepare(
			"INSERT INTO questions (question_text, correct_answer, options, quiz_id) VALUES (?, ?, ?, ?)"
		);

		// Insert Quiz 1 questions
		generalKnowledgeQuestions.forEach(q => {
			insertQuizQuestion.run(
				q.text,
				q.answer,
				JSON.stringify(q.options),
				quiz1Id
			);
		});

		// Insert Quiz 2 questions
		mathQuestions.forEach(q => {
			insertQuizQuestion.run(
				q.text,
				q.answer,
				JSON.stringify(q.options),
				quiz2Id
			);
		});

		// Insert Quiz 3 questions
		scienceQuestions.forEach(q => {
			insertQuizQuestion.run(
				q.text,
				q.answer,
				JSON.stringify(q.options),
				quiz3Id
			);
		});

		// Insert Quiz 4 questions
		geographyQuestions.forEach(q => {
			insertQuizQuestion.run(
				q.text,
				q.answer,
				JSON.stringify(q.options),
				quiz4Id
			);
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
		console.log(
			`  • 1 active single question with multiple choice options`
		);
		console.log(`  • 4 quizzes (3 active, 1 inactive)`);
		console.log(
			`  • 20 quiz questions total (all with multiple choice options)`
		);
		console.log(`  • Multiple attempts logged`);

		console.log("\n🧪 Test Endpoints:");
		console.log(`  • GET /api/question (single question)`);
		console.log(`  • GET /api/leaderboard (single question leaderboard)`);
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
