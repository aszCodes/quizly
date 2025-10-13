// src/utils/scoring.js

export const calculateScore = (answers, questions) => {
	let score = 0;

	const detailedResults = answers.map((selectedIndex, index) => {
		const question = questions[index];

		// Validate answer is within bounds
		const isValidAnswer =
			selectedIndex !== null &&
			selectedIndex >= 0 &&
			selectedIndex < question.options.length;

		const isCorrect =
			isValidAnswer && selectedIndex === question.correctAnswerIndex;

		if (isCorrect) {
			score++;
		}

		return {
			questionText: question.questionText,
			options: question.options,
			selectedAnswer: selectedIndex,
			correctAnswer: question.correctAnswerIndex,
			isCorrect: isCorrect,
		};
	});

	const totalQuestions = questions.length;
	const percentage = Math.round((score / totalQuestions) * 100);

	return {
		score,
		totalQuestions,
		percentage,
		detailedResults,
	};
};

export const validateAnswersFormat = (answers) => {
	if (!Array.isArray(answers)) return false;

	return answers.every(
		(ans) =>
			ans === null ||
			(typeof ans === "number" && ans >= 0 && Number.isInteger(ans))
	);
};
