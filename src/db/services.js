import db from "./database.js";

// Quiz Services
export const getAllQuizzes = () => {
	return db.prepare("SELECT * FROM quizzes WHERE isActive = 1").all();
};

export const getAllQuizzesWithQuestionCount = () => {
	return db
		.prepare(
			`
		SELECT
			q.*,
			COUNT(qu.id) as questionCount
		FROM quizzes q
		LEFT JOIN questions qu ON q.id = qu.quizId
		GROUP BY q.id
		ORDER BY q.createdAt DESC
	`
		)
		.all();
};

export const getQuizById = (id) => {
	return db.prepare("SELECT * FROM quizzes WHERE id = ?").get(id);
};

export const createQuizService = (
	title,
	description,
	timeLimit,
	allowedAttempts
) => {
	const stmt = db.prepare(`
		INSERT INTO quizzes (title, description, timeLimit, allowedAttempts, isActive)
		VALUES (?, ?, ?, ?, 0)
	`);
	return stmt.run(title, description, timeLimit, allowedAttempts);
};

export const updateQuizService = (
	id,
	title,
	description,
	timeLimit,
	allowedAttempts
) => {
	const stmt = db.prepare(`
		UPDATE quizzes
		SET title = ?, description = ?, timeLimit = ?, allowedAttempts = ?
		WHERE id = ?
	`);
	return stmt.run(title, description, timeLimit, allowedAttempts, id);
};

export const deleteQuizService = (id) => {
	const stmt = db.prepare("DELETE FROM quizzes WHERE id = ?");
	return stmt.run(id);
};

export const deactivateAllQuizzes = () => {
	return db.prepare("UPDATE quizzes SET isActive = 0").run();
};

export const activateQuizService = (id) => {
	return db.prepare("UPDATE quizzes SET isActive = 1 WHERE id = ?").run(id);
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

export const getAllQuestionsService = () => {
	const questions = db
		.prepare("SELECT * FROM questions ORDER BY quizId, id")
		.all();

	return questions.map((q) => ({
		...q,
		options: JSON.parse(q.options),
	}));
};

export const createQuestionService = (
	quizId,
	questionText,
	options,
	correctAnswerIndex,
	explanation = null
) => {
	const stmt = db.prepare(`
		INSERT INTO questions (quizId, questionText, options, correctAnswerIndex, explanation)
		VALUES (?, ?, ?, ?, ?)
	`);

	return stmt.run(
		quizId,
		questionText,
		JSON.stringify(options),
		correctAnswerIndex,
		explanation
	);
};

export const updateQuestionService = (
	questionId,
	quizId,
	questionText,
	options,
	correctAnswerIndex,
	explanation = null
) => {
	const stmt = db.prepare(`
		UPDATE questions
		SET quizId = ?, questionText = ?, options = ?, correctAnswerIndex = ?, explanation = ?
		WHERE id = ?
	`);

	return stmt.run(
		quizId,
		questionText,
		JSON.stringify(options),
		correctAnswerIndex,
		explanation,
		questionId
	);
};

export const deleteQuestionService = (questionId) => {
	const stmt = db.prepare("DELETE FROM questions WHERE id = ?");
	return stmt.run(questionId);
};

export const importQuestionsService = (quizId, questions) => {
	const stmt = db.prepare(`
		INSERT INTO questions (quizId, questionText, options, correctAnswerIndex, explanation)
		VALUES (?, ?, ?, ?, ?)
	`);

	const insertMany = db.transaction((questions) => {
		for (const q of questions) {
			stmt.run(
				quizId,
				q.questionText,
				JSON.stringify(q.options),
				q.correctAnswerIndex,
				q.explanation || null
			);
		}
	});

	return insertMany(questions);
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
