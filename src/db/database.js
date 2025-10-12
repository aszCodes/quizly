import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const db = new Database(join(__dirname, "../../quizly.db"));

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
const initDB = () => {
	// Quizzes table
	db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      timeLimit INTEGER NOT NULL,
      isActive INTEGER DEFAULT 1,
      allowedAttempts INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Questions table
	db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId INTEGER NOT NULL,
      questionText TEXT NOT NULL,
      options TEXT NOT NULL,
      correctAnswerIndex INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `);

	// Attempts table
	db.exec(`
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId INTEGER NOT NULL,
      studentName TEXT NOT NULL,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      totalQuestions INTEGER NOT NULL,
      completedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `);

	console.log("Database initialized");
};

// Seed initial data if tables are empty
const seedData = () => {
	const quizCount = db.prepare("SELECT COUNT(*) as count FROM quizzes").get();

	if (quizCount.count === 0) {
		console.log("Seeding initial data...");

		// Insert quiz
		const insertQuiz = db.prepare(`
      INSERT INTO quizzes (title, description, timeLimit, isActive, allowedAttempts)
      VALUES (?, ?, ?, ?, ?)
    `);

		insertQuiz.run("DSA Quiz #2", "Week 1 and Week 2 Quiz", 1, 1, 1);

		// Insert question
		const insertQuestion = db.prepare(`
      INSERT INTO questions (quizId, questionText, options, correctAnswerIndex)
      VALUES (?, ?, ?, ?)
    `);

		const options = JSON.stringify([
			"Data Structure",
			"Data Type",
			"Data Flow",
		]);
		insertQuestion.run(
			1,
			"It is an organized way to store and manage data",
			options,
			0
		);

		console.log("Initial data seeded");
	}
};

// Initialize on import
initDB();
seedData();

export default db;
