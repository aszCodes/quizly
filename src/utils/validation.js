export const validateQuiz = (quiz) => {
	const errors = [];

	if (!quiz.title?.trim()) {
		errors.push("Quiz title is required");
	}

	if (!quiz.timeLimit || quiz.timeLimit < 1) {
		errors.push("Time limit must be at least 1 minute");
	}

	if (!quiz.allowedAttempts || quiz.allowedAttempts < 1) {
		errors.push("Allowed attempts must be at least 1");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

export const validateQuestion = (question) => {
	const errors = [];

	if (!question.questionText?.trim()) {
		errors.push("Question text is required");
	}

	if (!Array.isArray(question.options) || question.options.length < 2) {
		errors.push("At least 2 options are required");
	}

	// Check for empty options
	if (question.options.some((opt) => !opt?.trim())) {
		errors.push("All options must have text");
	}

	// Check for duplicate options
	const uniqueOptions = new Set(
		question.options.map((o) => o.trim().toLowerCase())
	);
	if (uniqueOptions.size !== question.options.length) {
		errors.push("Options must be unique");
	}

	if (
		typeof question.correctAnswerIndex !== "number" ||
		question.correctAnswerIndex < 0 ||
		question.correctAnswerIndex >= question.options.length
	) {
		errors.push("Invalid correct answer index");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};
