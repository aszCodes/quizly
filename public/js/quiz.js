import { getState, setState, resetState } from "./state.js";
import { elements, showScreen, showError, formatTime } from "./dom.js";
import { fetchQuiz, fetchQuestions, submitQuiz } from "./api.js";

// Timer Functions
function startTimer(duration) {
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
		header.innerHTML = `
			<span class="status-icon">${statusIcon}</span>
			<div class="question-text-result">${index + 1}. ${result.questionText}</div>
		`;

		// Answer section
		const answerSection = document.createElement("div");
		answerSection.className = "answer-section";

		result.options.forEach((option, optionIndex) => {
			const answerRow = document.createElement("div");
			answerRow.className = "answer-row";

			const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D...
			let answerStatus = "";

			// Determine answer row styling
			if (optionIndex === result.correctAnswer) {
				answerRow.classList.add("correct-answer");
				answerStatus = '<span class="answer-status"> ✓ Correct answer</span>';
			}

			if (result.selectedAnswer === optionIndex && !result.isCorrect) {
				answerRow.classList.add("wrong-selection");
				answerStatus = '<span class="answer-status"> ✗ Your answer</span>';
			}

			if (result.selectedAnswer === optionIndex && result.isCorrect) {
				answerStatus = '<span class="answer-status"> ✓ Your answer</span>';
			}

			answerRow.innerHTML = `
				<span class="answer-label">${optionLabel}.</span> ${option}${answerStatus}
			`;

			answerSection.appendChild(answerRow);
		});

		// Add explanation for unanswered
		if (result.selectedAnswer === null) {
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
		if (detailedResultsDiv.classList.contains("show")) {
			toggleBtn.textContent = "Hide Detailed Results";
		} else {
			toggleBtn.textContent = "Show Detailed Results";
		}
	};
}

// Main Quiz Functions
export async function startQuiz() {
	const studentName = elements.studentNameInput.value.trim();

	if (!studentName) {
		showError("Please enter your name");
		return;
	}

	try {
		const quiz = await fetchQuiz();
		const questions = await fetchQuestions();

		setState({
			quiz,
			questions,
			studentName,
			answers: new Array(questions.length).fill(null),
		});

		elements.quizTitle.textContent = quiz.title;
		renderQuestions();
		startTimer(quiz.timeLimit);
		showScreen(elements.quizScreen);
	} catch (error) {
		console.error("Error starting quiz:", error);
	}
}

async function handleSubmitQuiz() {
	const { quiz, studentName, answers } = getState();

	stopTimer();

	if (answers.includes(null)) {
		const confirmSubmit = confirm(
			"You haven't answered all questions. Submit anyway?"
		);
		if (!confirmSubmit) {
			// Restart timer
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
			return;
		}
	}

	// Disable submit button to prevent double submission
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

		// Re-enable submit button on error
		elements.submitBtn.disabled = false;
		elements.submitBtn.textContent = "Submit Quiz";

		const { timeLeft } = getState();
		if (timeLeft > 0) {
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
	}
}

// Export for event listeners
export { handleSubmitQuiz as submitQuiz };

export function resetQuiz() {
	resetState();
	elements.studentNameInput.value = "";
	elements.submitBtn.disabled = false;
	elements.submitBtn.textContent = "Submit Quiz";

	document.getElementById("detailed-results").classList.remove("show");
	document.getElementById("toggle-btn").textContent = "Show Detailed Results";

	showScreen(elements.startScreen);
}
