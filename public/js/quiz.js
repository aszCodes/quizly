import { getState, setState, resetState } from "./state.js";
import { elements, showScreen, showError, formatTime } from "./dom.js";
import { fetchQuiz, fetchQuestions, submitQuiz } from "./api.js";

let isSubmitting = false;

// Timer Functions
function startTimer(duration) {
	// Clear any existing timer
	stopTimer();

	const timeLeft = duration * 60;
	setState({ timeLeft });

	elements.timerElement.textContent = `Time: ${formatTime(timeLeft)}`;

	const timerInterval = setInterval(() => {
		const { timeLeft } = getState();
		const newTimeLeft = timeLeft - 1;
		setState({ timeLeft: newTimeLeft });

		elements.timerElement.textContent = `Time: ${formatTime(newTimeLeft)}`;

		if (newTimeLeft <= 0) {
			stopTimer();
			handleSubmitQuiz();
		}
	}, 1000);

	setState({ timerInterval });
}

function stopTimer() {
	const { timerInterval } = getState();
	if (timerInterval) {
		clearInterval(timerInterval);
		setState({ timerInterval: null });
	}
}

// Question Rendering
function renderQuestions() {
	const { questions } = getState();
	elements.questionsContainer.innerHTML = "";

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
			radio.addEventListener("change", (e) => {
				handleAnswerChange(index, optionIndex, question.id, e.target);
			});

			label.appendChild(radio);
			label.appendChild(document.createTextNode(option));
			optionsDiv.appendChild(label);
		});

		questionDiv.appendChild(questionText);
		questionDiv.appendChild(optionsDiv);
		elements.questionsContainer.appendChild(questionDiv);
	});
}

function handleAnswerChange(questionIndex, answerIndex, questionId, target) {
	const { answers } = getState();
	const newAnswers = [...answers];
	newAnswers[questionIndex] = answerIndex;
	setState({ answers: newAnswers });

	// Update UI
	document
		.querySelectorAll(`input[name="question-${questionId}"]`)
		.forEach((r) => {
			r.parentElement.classList.remove("selected");
		});
	target.parentElement.classList.add("selected");
}

// Results Rendering
function renderDetailedResults(detailedResults, studentName) {
	const detailedResultsContainer = document.getElementById("detailed-results");
	detailedResultsContainer.innerHTML = "";

	let correctCount = 0;
	let incorrectCount = 0;
	let unansweredCount = 0;

	detailedResults.forEach((result, index) => {
		const questionDiv = document.createElement("div");

		// Determine status
		let status = "";
		let statusIcon = "";
		if (result.selectedAnswer === null) {
			status = "unanswered";
			statusIcon = "⚠";
			unansweredCount++;
		} else if (result.isCorrect) {
			status = "correct";
			statusIcon = "✓";
			correctCount++;
		} else {
			status = "incorrect";
			statusIcon = "✗";
			incorrectCount++;
		}

		questionDiv.className = `question-result ${status}`;

		// Question header
		const header = document.createElement("div");
		header.className = "question-header";

		const statusSpan = document.createElement("span");
		statusSpan.className = "status-icon";
		statusSpan.textContent = statusIcon;

		const questionTextDiv = document.createElement("div");
		questionTextDiv.className = "question-text-result";
		questionTextDiv.textContent = `${index + 1}. ${result.questionText}`;

		header.appendChild(statusSpan);
		header.appendChild(questionTextDiv);

		// Answer section
		const answerSection = document.createElement("div");
		answerSection.className = "answer-section";

		result.options.forEach((option, optionIndex) => {
			const answerRow = document.createElement("div");
			answerRow.className = "answer-row";

			const optionLabel = String.fromCharCode(65 + optionIndex);

			// Determine answer row styling
			if (optionIndex === result.correctAnswer) {
				answerRow.classList.add("correct-answer");
			}

			if (result.selectedAnswer === optionIndex && !result.isCorrect) {
				answerRow.classList.add("wrong-selection");
			}

			const labelSpan = document.createElement("span");
			labelSpan.className = "answer-label";
			labelSpan.textContent = `${optionLabel}.`;

			const optionText = document.createTextNode(` ${option}`);

			answerRow.appendChild(labelSpan);
			answerRow.appendChild(optionText);

			// Add status indicator
			if (optionIndex === result.correctAnswer) {
				const statusSpan = document.createElement("span");
				statusSpan.className = "answer-status";
				statusSpan.textContent = " ✓ Correct answer";
				answerRow.appendChild(statusSpan);
			} else if (result.selectedAnswer === optionIndex && !result.isCorrect) {
				const statusSpan = document.createElement("span");
				statusSpan.className = "answer-status";
				statusSpan.textContent = " ✗ Your answer";
				answerRow.appendChild(statusSpan);
			}

			answerSection.appendChild(answerRow);
		});

		if (result.explanation) {
			const explanationDiv = document.createElement("div");
			explanationDiv.className = "explanation";
			explanationDiv.innerHTML = `<strong> Explanation:</strong> ${result.explanation}`;
			answerSection.appendChild(explanationDiv);
		} else if (result.selectedAnswer === null) {
			// Keep existing unanswered message
			const explanation = document.createElement("div");
			explanation.className = "explanation";
			explanation.textContent = "You did not answer this question.";
			answerSection.appendChild(explanation);
		}

		questionDiv.appendChild(header);
		questionDiv.appendChild(answerSection);
		detailedResultsContainer.appendChild(questionDiv);
	});

	// Update stats
	document.getElementById("correct-count").textContent = correctCount;
	document.getElementById("incorrect-count").textContent = incorrectCount;
	document.getElementById("unanswered-count").textContent = unansweredCount;

	// Setup toggle button
	const toggleBtn = document.getElementById("toggle-btn");
	const detailedResultsDiv = document.getElementById("detailed-results");

	toggleBtn.onclick = () => {
		detailedResultsDiv.classList.toggle("show");
		toggleBtn.textContent = detailedResultsDiv.classList.contains("show")
			? "Hide Detailed Results"
			: "Show Detailed Results";
	};
}

// Main Quiz Functions
export async function startQuiz() {
	const studentName = elements.studentNameInput.value.trim();

	if (!studentName) {
		showError("Please enter your name");
		return;
	}

	// Sanitize student name
	const sanitizedName = studentName.replace(/[<>\"']/g, "");
	if (sanitizedName.length < 2) {
		showError("Please enter a valid name (at least 2 characters)");
		return;
	}

	try {
		const quiz = await fetchQuiz();
		const questions = await fetchQuestions();

		// Validate quiz has questions
		if (!questions || questions.length === 0) {
			showError("This quiz has no questions yet. Please try again later.");
			return;
		}

		// Reset submission lock
		isSubmitting = false;

		setState({
			quiz,
			questions,
			studentName: sanitizedName,
			answers: new Array(questions.length).fill(null),
		});

		elements.quizTitle.textContent = quiz.title;
		renderQuestions();
		startTimer(quiz.timeLimit);
		showScreen(elements.quizScreen);
	} catch (error) {
		console.error("Error starting quiz:", error);
		showError("Failed to start quiz. Please try again.");
	}
}

async function handleSubmitQuiz() {
	// Prevent double submission
	if (isSubmitting) {
		return;
	}

	const { quiz, studentName, answers, timeLeft } = getState();

	// Stop timer immediately
	stopTimer();

	// Check for unanswered questions
	if (answers.includes(null) && timeLeft > 0) {
		const confirmSubmit = confirm(
			"You haven't answered all questions. Submit anyway?"
		);
		if (!confirmSubmit) {
			// Restart timer only if user cancels
			startTimer(Math.ceil(timeLeft / 60));
			return;
		}
	}

	// Set lock and disable button
	isSubmitting = true;
	elements.submitBtn.disabled = true;
	elements.submitBtn.textContent = "Submitting...";

	try {
		const result = await submitQuiz(quiz.id, studentName, answers);

		// Update summary section
		elements.resultName.textContent = studentName;
		document.getElementById(
			"score-display"
		).textContent = `${result.score}/${result.totalQuestions}`;
		document.getElementById(
			"percentage-display"
		).textContent = `You scored ${result.percentage}%`;

		// Render detailed results
		renderDetailedResults(result.detailedResults, studentName);

		showScreen(elements.resultsScreen);
	} catch (error) {
		console.error("Error submitting quiz:", error);

		// Only allow retry if submission actually failed
		if (!error.message?.includes("Maximum attempts") && timeLeft > 0) {
			isSubmitting = false;
			elements.submitBtn.disabled = false;
			elements.submitBtn.textContent = "Submit Quiz";
			startTimer(Math.ceil(timeLeft / 60));
		} else {
			// For attempt limit errors, keep button disabled
			elements.submitBtn.textContent = "Cannot Submit";
		}
	}
}

// Export for event listeners
export { handleSubmitQuiz as submitQuiz };

export function resetQuiz() {
	stopTimer();
	resetState();
	isSubmitting = false;

	elements.studentNameInput.value = "";
	elements.submitBtn.disabled = false;
	elements.submitBtn.textContent = "Submit Quiz";

	document.getElementById("detailed-results").classList.remove("show");
	document.getElementById("toggle-btn").textContent = "Show Detailed Results";

	showScreen(elements.startScreen);
}
