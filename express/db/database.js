import Database from "better-sqlite3";
import path from "node:path";

const __dirname = path.dirname(import.meta.filename);
const db = new Database(path.join(__dirname, "quiz.db"));

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize tables
function initDB() {
	// Students table
	db.exec(`
		CREATE TABLE IF NOT EXISTS students (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			section TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Quizzes table
	db.exec(`
		CREATE TABLE IF NOT EXISTS quizzes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			is_active INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Questions table
	db.exec(`
		CREATE TABLE IF NOT EXISTS questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			question_text TEXT NOT NULL,
			correct_answer TEXT NOT NULL,
			options TEXT,
			quiz_id INTEGER,
			is_active INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
		)
	`);

	// Attempts table
	db.exec(`
		CREATE TABLE IF NOT EXISTS attempts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id INTEGER NOT NULL,
			question_id INTEGER NOT NULL,
			quiz_id INTEGER,
			student_answer TEXT NOT NULL,
			score REAL NOT NULL,
			duration INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (student_id) REFERENCES students(id),
			FOREIGN KEY (question_id) REFERENCES questions(id),
			FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
		)
	`);

	// Quiz Sessions table
	db.exec(`
		CREATE TABLE IF NOT EXISTS quiz_sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_token TEXT UNIQUE NOT NULL,
			student_id INTEGER NOT NULL,
			quiz_id INTEGER NOT NULL,
			question_order TEXT NOT NULL,
			current_question_index INTEGER DEFAULT 0,
			started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			expires_at DATETIME NOT NULL,
			completed_at DATETIME,
			FOREIGN KEY (student_id) REFERENCES students(id),
			FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
		)
	`);

	// Question Views table
	db.exec(`
		CREATE TABLE IF NOT EXISTS question_views (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_id INTEGER NOT NULL,
			question_id INTEGER NOT NULL,
			viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			answered_at DATETIME,
			FOREIGN KEY (session_id) REFERENCES quiz_sessions(id),
			FOREIGN KEY (question_id) REFERENCES questions(id)
		)
	`);

	console.log("Database initialized");
}

initDB();

export default db;
