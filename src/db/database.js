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

initDB();

export default db;
