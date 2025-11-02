import db from "../db/database.js";

export const clearDatabase = () => {
	db.pragma("foreign_keys = OFF");

	const tables = [
		"attempts",
		"questions",
		"quizzes",
		"students",
		"quiz_sessions",
		"question_views",
	];

	for (const table of tables) db.exec(`DELETE FROM ${table}`);
	db.exec("DELETE FROM sqlite_sequence");

	db.pragma("foreign_keys = ON");
};

// --- Test data factories ---

export const createTestStudent = (name = "Test Student", section = null) => {
	const result = db
		.prepare("INSERT INTO students (name, section) VALUES (?, ?)")
		.run(name, section);
	return result.lastInsertRowid;
};

export const createTestQuiz = ({ title = "Test Quiz", is_active = 1 } = {}) => {
	const result = db
		.prepare("INSERT INTO quizzes (title, is_active) VALUES (?, ?)")
		.run(title, is_active);
	return result.lastInsertRowid;
};

export const createTestQuestion = ({
	question_text = "Test Question?",
	correct_answer = "A",
	options = ["A", "B", "C", "D"],
	quiz_id = null,
	is_active = 1,
} = {}) => {
	const result = db
		.prepare(
			`INSERT INTO questions (question_text, correct_answer, options, quiz_id, is_active)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.run(
			question_text,
			correct_answer,
			JSON.stringify(options),
			quiz_id,
			is_active
		);
	return result.lastInsertRowid;
};
