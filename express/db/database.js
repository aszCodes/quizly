import Database from "better-sqlite3";
import path from "node:path";

const __dirname = path.dirname(import.meta.filename);
const db = new Database(path.join(__dirname, "quiz.db"), {
	verbose: console.log,
});

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize tables
function initDB() {
	// Students table
	db.exec(`
		CREATE TABLE IF NOT EXISTS students (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Questions table
	db.exec(`
		CREATE TABLE IF NOT EXISTS questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			question_text TEXT NOT NULL,
			correct_answer TEXT NOT NULL,
			is_active INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Attempts table
	db.exec(`
		CREATE TABLE IF NOT EXISTS attempts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id INTEGER NOT NULL,
			question_id INTEGER NOT NULL,
			student_answer TEXT NOT NULL,
			score REAL NOT NULL,
			duration INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (student_id) REFERENCES students(id),
			FOREIGN KEY (question_id) REFERENCES questions(id)
		)
	`);

	console.log("Database initialized");
}

initDB();

export default db;
