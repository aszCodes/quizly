const testAPI = async () => {
	// Test GET quiz
	const quiz = await fetch("http://localhost:3000/api/quiz");
	console.log("Quiz:", await quiz.json());

	// Test GET questions
	const questions = await fetch("http://localhost:3000/api/questions");
	console.log("Questions:", await questions.json());

	// Test POST submit
	const submit = await fetch("http://localhost:3000/api/submit", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			quizId: 1,
			studentName: "Test Student",
			answers: [0],
		}),
	});
	console.log("Submit:", await submit.json());
};

testAPI();
