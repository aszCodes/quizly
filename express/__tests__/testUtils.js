import db from "../db/database.js";

// Helper functions for creating test data

export const clearDatabase = () => {
	db.exec("DELETE FROM attempts");
	db.exec("DELETE FROM questions");
	db.exec("DELETE FROM quizzes");
	db.exec("DELETE FROM students");
};

// Create test data helpers
export const createTestStudent = (name = "Test Student") => {
	const result = db
		.prepare("INSERT INTO students (name) VALUES (?)")
		.run(name);
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

export const createTestQuiz = ({ title = "Test Quiz", is_active = 1 } = {}) => {
	const result = db
		.prepare("INSERT INTO quizzes (title, is_active) VALUES (?, ?)")
		.run(title, is_active);
	return result.lastInsertRowid;
};
