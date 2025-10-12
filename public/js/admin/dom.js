// DOM element references and UI utilities

export const elements = {
	// Tabs
	tabs: document.querySelectorAll(".tab"),
	tabContents: document.querySelectorAll(".tab-content"),

	// Dashboard
	statsContainer: document.getElementById("stats-container"),
	recentAttempts: document.getElementById("recent-attempts"),

	// Quizzes
	quizzesList: document.getElementById("quizzes-list"),
	createQuizBtn: document.getElementById("create-quiz-btn"),
	alertContainer: document.getElementById("alert-container"),

	// Quiz Modal
	quizModal: document.getElementById("quiz-modal"),
	quizModalTitle: document.getElementById("quiz-modal-title"),
	quizForm: document.getElementById("quiz-form"),
	quizId: document.getElementById("quiz-id"),
	quizTitle: document.getElementById("quiz-title"),
	quizDescription: document.getElementById("quiz-description"),
	quizTimeLimit: document.getElementById("quiz-time-limit"),
	quizAllowedAttempts: document.getElementById("quiz-allowed-attempts"),

	// Questions
	questionsList: document.getElementById("questions-list"),
	addQuestionBtn: document.getElementById("add-question-btn"),
	importQuestionsBtn: document.getElementById("import-questions-btn"),
	quizFilter: document.getElementById("quiz-filter"),

	// Question Modal
	questionModal: document.getElementById("question-modal"),
	questionModalTitle: document.getElementById("question-modal-title"),
	questionForm: document.getElementById("question-form"),
	questionId: document.getElementById("question-id"),
	questionQuizId: document.getElementById("question-quiz-id"),
	questionText: document.getElementById("question-text"),
	optionsContainer: document.getElementById("options-container"),
	addOptionBtn: document.getElementById("add-option-btn"),

	// Import Modal
	importModal: document.getElementById("import-modal"),
	importQuizId: document.getElementById("import-quiz-id"),
	fileInput: document.getElementById("file-input"),
	fileUploadArea: document.getElementById("file-upload-area"),
	importBtn: document.getElementById("import-btn"),

	// Attempts
	attemptsTable: document.querySelector("#attempts-table tbody"),
	attemptsQuizFilter: document.getElementById("attempts-quiz-filter"),
	exportAttemptsBtn: document.getElementById("export-attempts-btn"),

	// Modals
	closeModalBtns: document.querySelectorAll(".close-modal"),
};

// UI Functions
export function showAlert(message, type) {
	const alertDiv = document.createElement("div");
	alertDiv.className = `alert alert-${type}`;
	alertDiv.textContent = message;

	elements.alertContainer.innerHTML = "";
	elements.alertContainer.appendChild(alertDiv);

	setTimeout(() => {
		alertDiv.remove();
	}, 5000);
}

export function showModal(modalElement) {
	modalElement.classList.add("show");
}

export function hideModal(modalElement) {
	modalElement.classList.remove("show");
}

export function hideAllModals() {
	document
		.querySelectorAll(".modal")
		.forEach((m) => m.classList.remove("show"));
}

export function switchTab(tabName) {
	elements.tabs.forEach((t) => t.classList.remove("active"));
	elements.tabContents.forEach((c) => c.classList.remove("active"));

	document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
	document.getElementById(tabName).classList.add("active");
}

export function updateQuizSelects(quizzes) {
	const selects = [
		elements.quizFilter,
		elements.attemptsQuizFilter,
		elements.questionQuizId,
		elements.importQuizId,
	];

	selects.forEach((select) => {
		const currentValue = select.value;
		const firstOption = select.querySelector("option");
		select.innerHTML = firstOption
			? firstOption.outerHTML
			: '<option value="">Select a quiz</option>';

		quizzes.forEach((quiz) => {
			const option = document.createElement("option");
			option.value = quiz.id;
			option.textContent = quiz.title;
			select.appendChild(option);
		});

		if (currentValue) select.value = currentValue;
	});
}

export function addOptionInput(value = "", isCorrect = false) {
	const index = elements.optionsContainer.children.length;

	const div = document.createElement("div");
	div.className = "option-input-group";
	div.innerHTML = `
        <input type="radio" name="correct-option" value="${index}" ${
		isCorrect ? "checked" : ""
	} required>
        <input type="text" placeholder="Option ${String.fromCharCode(
					65 + index
				)}" value="${value}" required>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
	elements.optionsContainer.appendChild(div);
}

export function clearOptionsContainer() {
	elements.optionsContainer.innerHTML = "";
}

export function resetFileUpload() {
	elements.fileInput.value = "";
	elements.importQuizId.value = "";
	elements.importBtn.disabled = true;
	elements.fileUploadArea.innerHTML = `
        <p style="color: #64748b; margin-bottom: 10px;">📁 Click to upload or drag and drop</p>
        <p style="color: #94a3b8; font-size: 0.9rem;">Supports JSON files only</p>
    `;
}
