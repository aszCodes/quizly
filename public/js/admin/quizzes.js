// Quiz management functionality
import {
	fetchQuizzes,
	createQuiz,
	updateQuiz,
	deleteQuiz,
	activateQuiz,
} from "./api.js";
import {
	elements,
	showAlert,
	updateQuizSelects,
	showModal,
	hideModal,
} from "./dom.js";
import { getState, setState } from "./state.js";
import { loadDashboard } from "./dashboard.js";

export async function loadQuizzes() {
	try {
		const quizzes = await fetchQuizzes();
		setState({ currentQuizzes: quizzes });

		renderQuizzes(quizzes);
		updateQuizSelects(quizzes);
	} catch (error) {
		console.error("Error loading quizzes:", error);
	}
}

function renderQuizzes(quizzes) {
	elements.quizzesList.innerHTML = quizzes
		.map(
			(quiz) => `
        <div class="quiz-card ${quiz.isActive ? "active" : ""}">
            <div class="quiz-info">
                <h4>${quiz.title} ${
				quiz.isActive
					? '<span class="badge badge-success">Active</span>'
					: '<span class="badge badge-secondary">Inactive</span>'
			}</h4>
                <div class="quiz-meta">
                    ${quiz.description || "No description"} •
                    ${quiz.timeLimit} minutes •
                    ${quiz.allowedAttempts} attempt(s) •
                    ${quiz.questionCount || 0} questions
                </div>
            </div>
            <div class="quiz-actions">
                ${
									!quiz.isActive
										? `<button class="btn btn-success" onclick="window.handleSetActiveQuiz(${quiz.id})">Set Active</button>`
										: ""
								}
                <button class="btn btn-secondary" onclick="window.handleEditQuiz(${
									quiz.id
								})">Edit</button>
                <button class="btn btn-danger" onclick="window.handleDeleteQuiz(${
									quiz.id
								})">Delete</button>
            </div>
        </div>
    `
		)
		.join("");
}

export function openCreateQuizModal() {
	elements.quizModalTitle.textContent = "Create New Quiz";
	elements.quizForm.reset();
	elements.quizId.value = "";
	showModal(elements.quizModal);
}

export function openEditQuizModal(quizId) {
	const { currentQuizzes } = getState();
	const quiz = currentQuizzes.find((q) => q.id === quizId);

	elements.quizModalTitle.textContent = "Edit Quiz";
	elements.quizId.value = quiz.id;
	elements.quizTitle.value = quiz.title;
	elements.quizDescription.value = quiz.description || "";
	elements.quizTimeLimit.value = quiz.timeLimit;
	elements.quizAllowedAttempts.value = quiz.allowedAttempts;

	showModal(elements.quizModal);
}

export async function handleQuizFormSubmit(e) {
	e.preventDefault();

	const quizId = elements.quizId.value;
	const data = {
		title: elements.quizTitle.value,
		description: elements.quizDescription.value,
		timeLimit: parseInt(elements.quizTimeLimit.value),
		allowedAttempts: parseInt(elements.quizAllowedAttempts.value),
	};

	try {
		if (quizId) {
			await updateQuiz(quizId, data);
			showAlert("Quiz updated successfully!", "success");
		} else {
			await createQuiz(data);
			showAlert("Quiz created successfully!", "success");
		}

		hideModal(elements.quizModal);
		loadQuizzes();
		loadDashboard();
	} catch (error) {
		console.error("Error saving quiz:", error);
	}
}

export async function handleSetActiveQuiz(quizId) {
	try {
		await activateQuiz(quizId);
		showAlert("Quiz activated successfully!", "success");
		loadQuizzes();
		loadDashboard();
	} catch (error) {
		console.error("Error activating quiz:", error);
	}
}

export async function handleDeleteQuiz(quizId) {
	if (
		!confirm(
			"Are you sure you want to delete this quiz? This will also delete all associated questions and attempts."
		)
	) {
		return;
	}

	try {
		await deleteQuiz(quizId);
		showAlert("Quiz deleted successfully!", "success");
		loadQuizzes();
		loadDashboard();
	} catch (error) {
		console.error("Error deleting quiz:", error);
	}
}
