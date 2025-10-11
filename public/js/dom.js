// DOM Elements - matching your actual HTML
export const elements = {
	startScreen: document.getElementById("start-screen"),
	quizScreen: document.getElementById("quiz-screen"),
	resultsScreen: document.getElementById("results-screen"),
	studentNameInput: document.getElementById("student-name"),
	startBtn: document.getElementById("start-btn"),
	questionsContainer: document.getElementById("questions-container"),
	submitBtn: document.getElementById("submit-btn"),
	timerElement: document.getElementById("timer"),
	errorMessage: document.getElementById("error-message"),
	quizTitle: document.getElementById("quiz-title"),
	resultName: document.getElementById("result-name"),
	resultScore: document.getElementById("result-score"),
	resultTotal: document.getElementById("result-total"),
	resultPercentage: document.getElementById("result-percentage"),
};

// UI Functions
export function showScreen(screenElement) {
	document
		.querySelectorAll(".screen")
		.forEach((s) => s.classList.remove("active"));
	screenElement.classList.add("active");
}

export function showError(message) {
	elements.errorMessage.textContent = message;
	elements.errorMessage.classList.remove("hidden");
	setTimeout(() => {
		elements.errorMessage.classList.add("hidden");
	}, 5000);
}

export function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
