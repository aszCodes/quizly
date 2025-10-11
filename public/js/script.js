// API base URL
const API_URL = process.env.API_URL;

// State
let quiz = null;
let questions = [];
let studentName = "";
let answers = [];
let timeLeft = 0;
let timerInterval = null;

// DOM Elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const studentNameInput = document.getElementById("student-name");
const startBtn = document.getElementById("start-btn");
const questionsContainer = document.getElementById("questions-container");
const submitBtn = document.getElementById("submit-btn");
const timerElement = document.getElementById("timer");
const errorMessage = document.getElementById("error-message");

// Show error message
function showError(message) {
	errorMessage.textContent = message;
	errorMessage.classList.remove("hidden");
	setTimeout(() => {
		errorMessage.classList.add("hidden");
	}, 5000);
}

// Switch screens
function showScreen(screen) {
	document
		.querySelectorAll(".screen")
		.forEach((s) => s.classList.remove("active"));
	screen.classList.add("active");
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Start timer
function startTimer(duration) {
	timeLeft = duration * 60; // Convert minutes to seconds
	timerElement.textContent = `Time: ${formatTime(timeLeft)}`;

	timerInterval = setInterval(() => {
		timeLeft--;
		timerElement.textContent = `Time: ${formatTime(timeLeft)}`;

		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			submitQuiz();
		}
	}, 1000);
}

// Fetch quiz data
async function fetchQuiz() {
	try {
		const response = await fetch(`${API_URL}/quiz`);
		const data = await response.json();
		return data[0]; // Get first quiz
	} catch (error) {
		showError("Failed to load quiz");
		throw error;
	}
}

// Fetch questions
async function fetchQuestions() {
	try {
		const response = await fetch(`${API_URL}/questions`);
		return await response.json();
	} catch (error) {
		showError("Failed to load questions");
		throw error;
	}
}

// Render questions
function renderQuestions() {
	questionsContainer.innerHTML = "";

	questions.forEach((question, index) => {
		const questionDiv = document.createElement("div");
		questionDiv.className = "question";

		const questionText = document.createElement("div");
		questionText.className = "question-text";
		questionText.textContent = `${index + 1}. ${question.questionText}`;

		const optionsDiv = document.createElement("div");
		optionsDiv.className = "options";

		question.options.forEach((option, optionIndex) => {
			const label = document.createElement("label");
			label.className = "option";

			const radio = document.createElement("input");
			radio.type = "radio";
			radio.name = `question-${question.id}`;
			radio.value = optionIndex;
			radio.addEventListener("change", () => {
				answers[index] = optionIndex;
				// Update UI
				document
					.querySelectorAll(`input[name="question-${question.id}"]`)
					.forEach((r) => {
						r.parentElement.classList.remove("selected");
					});
				label.classList.add("selected");
			});

			label.appendChild(radio);
			label.appendChild(document.createTextNode(option));
			optionsDiv.appendChild(label);
		});

		questionDiv.appendChild(questionText);
		questionDiv.appendChild(optionsDiv);
		questionsContainer.appendChild(questionDiv);
	});
}

// Start quiz
async function startQuiz() {
	studentName = studentNameInput.value.trim();

	if (!studentName) {
		showError("Please enter your name");
		return;
	}

	try {
		// Fetch quiz and questions
		quiz = await fetchQuiz();
		questions = await fetchQuestions();

		// Initialize answers array
		answers = new Array(questions.length).fill(null);

		// Render quiz
		document.getElementById("quiz-title").textContent = quiz.title;
		renderQuestions();

		// Start timer
		startTimer(quiz.timeLimit);

		// Show quiz screen
		showScreen(quizScreen);
	} catch (error) {
		console.error("Error starting quiz:", error);
	}
}

// Submit quiz
async function submitQuiz() {
	// Stop timer
	if (timerInterval) {
		clearInterval(timerInterval);
	}

	// Check if all questions answered
	if (answers.includes(null)) {
		const confirmSubmit = confirm(
			"You haven't answered all questions. Submit anyway?"
		);
		if (!confirmSubmit) return;
	}

	try {
		const response = await fetch(`${API_URL}/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				quizId: quiz.id,
				studentName: studentName,
				answers: answers,
			}),
		});

		const result = await response.json();

		if (response.ok) {
			// Show results
			document.getElementById("result-name").textContent = studentName;
			document.getElementById("result-score").textContent = result.score;
			document.getElementById("result-total").textContent =
				result.totalQuestions;
			document.getElementById("result-percentage").textContent =
				result.percentage;

			showScreen(resultsScreen);
		} else {
			showError(result.error || "Failed to submit quiz");
		}
	} catch (error) {
		showError("Failed to submit quiz");
		console.error("Error submitting quiz:", error);
	}
}

// Event listeners
startBtn.addEventListener("click", startQuiz);
submitBtn.addEventListener("click", submitQuiz);
studentNameInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") startQuiz();
});
