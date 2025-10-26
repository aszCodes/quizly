import db from "../db/database.js";

// Jest setup file - runs before all tests

// Clean database before each test
beforeEach(() => {
	db.exec("DELETE FROM attempts");
	db.exec("DELETE FROM questions");
	db.exec("DELETE FROM quizzes");
	db.exec("DELETE FROM students");
});

// Clean up and close database connection after all tests
afterAll(() => {
	db.exec("DELETE FROM attempts");
	db.exec("DELETE FROM questions");
	db.exec("DELETE FROM quizzes");
	db.exec("DELETE FROM students");
	db.close();
});
