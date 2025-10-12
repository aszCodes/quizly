// Main admin application entry point
import { elements, hideAllModals, switchTab, addOptionInput } from "./dom.js";
import { loadDashboard } from "./dashboard.js";
import {
	loadQuizzes,
	openCreateQuizModal,
	openEditQuizModal,
	handleQuizFormSubmit,
	handleSetActiveQuiz,
	handleDeleteQuiz,
} from "./quizzes.js";
import {
	loadQuestions,
	openAddQuestionModal,
	openEditQuestionModal,
	openImportModal,
	handleQuestionFormSubmit,
	handleDeleteQuestion,
	handleFileSelect,
	handleImportQuestions,
	handleQuizFilterChange,
} from "./questions.js";
import {
	loadAttempts,
	handleAttemptsFilterChange,
	handleExportAttempts,
} from "./attempts.js";

// Initialize app
function initApp() {
	setupEventListeners();
	loadInitialData();
}

function setupEventListeners() {
	// Tab switching
	elements.tabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			const tabName = tab.dataset.tab;
			switchTab(tabName);

			// Load data when switching tabs
			if (tabName === "dashboard") loadDashboard();
			if (tabName === "quizzes") loadQuizzes();
			if (tabName === "questions") loadQuestions();
			if (tabName === "attempts") loadAttempts();
		});
	});

	// Modal close buttons
	elements.closeModalBtns.forEach((btn) => {
		btn.addEventListener("click", hideAllModals);
	});

	// Quiz management
	elements.createQuizBtn.addEventListener("click", openCreateQuizModal);
	elements.quizForm.addEventListener("submit", handleQuizFormSubmit);

	// Question management
	elements.addQuestionBtn.addEventListener("click", openAddQuestionModal);
	elements.questionForm.addEventListener("submit", handleQuestionFormSubmit);
	elements.addOptionBtn.addEventListener("click", () => addOptionInput());
	elements.quizFilter.addEventListener("change", handleQuizFilterChange);

	// Import questions
	elements.importQuestionsBtn.addEventListener("click", openImportModal);
	elements.fileInput.addEventListener("change", handleFileSelect);
	elements.importBtn.addEventListener("click", handleImportQuestions);

	// File upload area
	elements.fileUploadArea.addEventListener("click", () =>
		elements.fileInput.click()
	);
	elements.fileUploadArea.addEventListener("dragover", (e) => {
		e.preventDefault();
		elements.fileUploadArea.style.borderColor = "#667eea";
		elements.fileUploadArea.style.background = "#f8f9ff";
	});
	elements.fileUploadArea.addEventListener("dragleave", () => {
		elements.fileUploadArea.style.borderColor = "#cbd5e1";
		elements.fileUploadArea.style.background = "transparent";
	});
	elements.fileUploadArea.addEventListener("drop", (e) => {
		e.preventDefault();
		elements.fileUploadArea.style.borderColor = "#cbd5e1";
		elements.fileUploadArea.style.background = "transparent";

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			elements.fileInput.files = files;
			handleFileSelect({ target: elements.fileInput });
		}
	});

	// Attempts
	elements.attemptsQuizFilter.addEventListener(
		"change",
		handleAttemptsFilterChange
	);
	elements.exportAttemptsBtn.addEventListener("click", handleExportAttempts);
}

function loadInitialData() {
	loadDashboard();
	loadQuizzes();
}

// Expose handlers to window for inline event handlers
window.handleEditQuiz = openEditQuizModal;
window.handleSetActiveQuiz = handleSetActiveQuiz;
window.handleDeleteQuiz = handleDeleteQuiz;
window.handleEditQuestion = openEditQuestionModal;
window.handleDeleteQuestion = handleDeleteQuestion;

// Start the app
initApp();

console.log("Admin app initialized");
