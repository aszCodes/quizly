import db from "./database.js";

console.log("Seeding database...");

try {
	// Clear existing data (optional - comment out if you want to keep existing data)
	// db.exec('DELETE FROM attempts');
	// db.exec('DELETE FROM questions');
	// db.exec('DELETE FROM quizzes');
	// db.exec('DELETE FROM students');

	// Insert sample quizzes
	const quiz1 = db
		.prepare(
			`
		INSERT INTO quizzes (title, is_active)
		VALUES (?, ?)
	`
		)
		.run("JavaScript Basics", 1);

	const quiz2 = db
		.prepare(
			`
		INSERT INTO quizzes (title, is_active)
		VALUES (?, ?)
	`
		)
		.run("HTML & CSS Quiz", 1);

	const quiz3 = db
		.prepare(
			`
		INSERT INTO quizzes (title, is_active)
		VALUES (?, ?)
	`
		)
		.run("Node.js Fundamentals", 1);

	console.log("Quizzes created");

	// Insert questions for Quiz 1 (JavaScript Basics)
	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"What is the result of 2 + 2?",
		"4",
		JSON.stringify(["2", "3", "4", "5"]),
		quiz1.lastInsertRowid
	);

	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"Which keyword is used to declare a constant in JavaScript?",
		"const",
		JSON.stringify(["var", "let", "const", "constant"]),
		quiz1.lastInsertRowid
	);

	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"What does JSON stand for?",
		"JavaScript Object Notation",
		JSON.stringify([
			"JavaScript Object Notation",
			"Java Standard Object Notation",
			"JavaScript Online Notation",
			"Java Syntax Object Network",
		]),
		quiz1.lastInsertRowid
	);

	console.log("JavaScript Basics questions created");

	// Insert questions for Quiz 2 (HTML & CSS)
	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"Which HTML tag is used for creating a hyperlink?",
		"<a>",
		JSON.stringify(["<link>", "<a>", "<href>", "<url>"]),
		quiz2.lastInsertRowid
	);

	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"What does CSS stand for?",
		"Cascading Style Sheets",
		JSON.stringify([
			"Cascading Style Sheets",
			"Creative Style System",
			"Computer Style Sheets",
			"Colorful Style Sheets",
		]),
		quiz2.lastInsertRowid
	);

	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"Which property is used to change the background color in CSS?",
		"background-color",
		JSON.stringify(["color", "background-color", "bg-color", "bgcolor"]),
		quiz2.lastInsertRowid
	);

	console.log("HTML & CSS questions created");

	// Insert questions for Quiz 3 (Node.js)
	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"What is Node.js built on?",
		"V8 JavaScript Engine",
		JSON.stringify([
			"V8 JavaScript Engine",
			"SpiderMonkey Engine",
			"JavaScriptCore",
			"Chakra Engine",
		]),
		quiz3.lastInsertRowid
	);

	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`
	).run(
		"Which command is used to install packages in Node.js?",
		"npm install",
		JSON.stringify(["npm install", "node install", "npm get", "node get"]),
		quiz3.lastInsertRowid
	);

	console.log("Node.js questions created");

	// Insert a single standalone question (not part of a quiz)
	db.prepare(
		`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id, is_active)
		VALUES (?, ?, ?, ?, ?)
	`
	).run(
		"What is the capital of France?",
		"Paris",
		JSON.stringify(["London", "Berlin", "Paris", "Madrid"]),
		null, // Not part of a quiz
		1 // Active
	);

	console.log("Single question created");

	console.log("\nDatabase seeded successfully!");
	console.log("You can now run your server and visit http://localhost:3000");
} catch (error) {
	console.error("Error seeding database:", error);
	process.exit(1);
}

process.exit(0);
