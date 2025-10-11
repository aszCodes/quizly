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
			// Restart timer if user cancels
			startTimer(Math.floor(getState().timeLeft / 60));
			return;
		}
	}

	// Disable submit button to prevent double submission
	elements.submitBtn.disabled = true;
	elements.submitBtn.textContent = "Submitting...";

	try {
		const result = await submitQuiz(quiz.id, studentName, answers);

		elements.resultName.textContent = studentName;
		elements.resultScore.textContent = result.score;
		elements.resultTotal.textContent = result.totalQuestions;
		elements.resultPercentage.textContent = result.percentage;

		showScreen(elements.resultsScreen);
	} catch (error) {
		console.error("Error submitting quiz:", error);

		// Re-enable submit button on error
		elements.submitBtn.disabled = false;
		elements.submitBtn.textContent = "Submit Quiz";

		// Restart timer if there was an error
		const timeLeft = getState().timeLeft;
		if (timeLeft > 0) {
			startTimer(Math.floor(timeLeft / 60));
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
	showScreen(elements.startScreen);
}
