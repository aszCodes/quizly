import db from "./database.js";

// Quiz Services
export const getAllQuizzes = () => {
	return db.prepare("SELECT * FROM quizzes WHERE isActive = 1").all();
};

export const getQuizById = (id) => {
	return db.prepare("SELECT * FROM quizzes WHERE id = ?").get(id);
};

// Question Services
export const getQuestionsByQuizId = (quizId) => {
	const questions = db
		.prepare("SELECT * FROM questions WHERE quizId = ?")
		.all(quizId);

	// Parse options JSON for each question
	return questions.map((q) => ({
		...q,
		options: JSON.parse(q.options),
	}));
};

export const getSafeQuestionsByQuizId = (quizId) => {
	const questions = getQuestionsByQuizId(quizId);

	// Remove correct answer from response
	return questions.map((q) => ({
		id: q.id,
		quizId: q.quizId,
		questionText: q.questionText,
		options: q.options,
	}));
};

// Attempt Services
export const createAttempt = (
	quizId,
	studentName,
	answers,
	score,
	totalQuestions
) => {
	const stmt = db.prepare(`
    INSERT INTO attempts (quizId, studentName, answers, score, totalQuestions)
    VALUES (?, ?, ?, ?, ?)
  `);

	const result = stmt.run(
		quizId,
		studentName,
		JSON.stringify(answers),
		score,
		totalQuestions
	);

	return result.lastInsertRowid;
};

export const getAllAttempts = () => {
	const attempts = db
		.prepare("SELECT * FROM attempts ORDER BY completedAt DESC")
		.all();

	// Parse answers JSON
	return attempts.map((a) => ({
		...a,
		answers: JSON.parse(a.answers),
	}));
};

export const getAttemptsByQuizId = (quizId) => {
	const attempts = db
		.prepare(
			"SELECT * FROM attempts WHERE quizId = ? ORDER BY completedAt DESC"
		)
		.all(quizId);

	return attempts.map((a) => ({
		...a,
		answers: JSON.parse(a.answers),
	}));
};

export const getAttemptsByStudent = (studentName) => {
	const attempts = db
		.prepare(
			"SELECT * FROM attempts WHERE studentName = ? ORDER BY completedAt DESC"
		)
		.all(studentName);

	return attempts.map((a) => ({
		...a,
		answers: JSON.parse(a.answers),
	}));
};

export const countAttempts = (quizId, studentName) => {
	const result = db
		.prepare(
			`
    SELECT COUNT(*) as count
    FROM attempts
    WHERE quizId = ? AND studentName = ?
  `
		)
		.get(quizId, studentName);

	return result.count;
};
