import db from "../db/database.js";

// Jest setup file - runs before all tests

// Clean database before each test
beforeEach(() => {
	// Temporarily disable foreign keys for cleanup
	db.pragma("foreign_keys = OFF");

	// Delete all data (order doesn't matter now)
	db.exec("DELETE FROM attempts");
	db.exec("DELETE FROM questions");
	db.exec("DELETE FROM quizzes");
	db.exec("DELETE FROM students");

	// Reset auto-increment counters
	db.exec("DELETE FROM sqlite_sequence WHERE name='attempts'");
	db.exec("DELETE FROM sqlite_sequence WHERE name='questions'");
	db.exec("DELETE FROM sqlite_sequence WHERE name='quizzes'");
	db.exec("DELETE FROM sqlite_sequence WHERE name='students'");

	// Re-enable foreign keys
	db.pragma("foreign_keys = ON");
});

// Clean up and close database connection after all tests
afterAll(() => {
	db.pragma("foreign_keys = OFF");
	db.exec("DELETE FROM attempts");
	db.exec("DELETE FROM questions");
	db.exec("DELETE FROM quizzes");
	db.exec("DELETE FROM students");
	db.exec("DELETE FROM sqlite_sequence");
	db.close();
});
