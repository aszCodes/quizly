// Question management functionality
import {
	fetchQuestions,
	createQuestion,
	updateQuestion,
	deleteQuestion,
	importQuestions,
} from "./api.js";
import {
	elements,
	showAlert,
	showModal,
	hideModal,
	addOptionInput,
	clearOptionsContainer,
	resetFileUpload,
} from "./dom.js";
import { getState, setState, resetImportState } from "./state.js";

export async function loadQuestions() {
	try {
		const questions = await fetchQuestions();
		setState({ currentQuestions: questions });

		renderQuestions(questions);
	} catch (error) {
		console.error("Error loading questions:", error);
	}
}

function renderQuestions(questions) {
	const quizId = elements.quizFilter.value;
	const filtered = quizId
		? questions.filter((q) => q.quizId == quizId)
		: questions;

	elements.questionsList.innerHTML =
		filtered.length > 0
			? filtered
					.map(
						(q) => `
            <div class="question-item">
                <div class="question-header">
                    <div class="question-text">${q.questionText}</div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="window.handleEditQuestion(${
													q.id
												})">Edit</button>
                        <button class="btn btn-danger" onclick="window.handleDeleteQuestion(${
													q.id
												})">Delete</button>
                    </div>
                </div>
                <div class="question-options">
                    ${q.options
											.map(
												(opt, idx) => `
                        <div class="question-option ${
													idx === q.correctAnswerIndex ? "correct" : ""
												}">
                            ${String.fromCharCode(65 + idx)}. ${opt} ${
													idx === q.correctAnswerIndex ? "✓" : ""
												}
                        </div>
                    `
											)
											.join("")}
                </div>
            </div>
        `
					)
					.join("")
			: '<p style="color: #64748b;">No questions found</p>';
}

export function openAddQuestionModal() {
	elements.questionModalTitle.textContent = "Add Question";
	elements.questionForm.reset();
	elements.questionId.value = "";

	clearOptionsContainer();
	addOptionInput("", true);
	addOptionInput("", false);

	showModal(elements.questionModal);
}

export function openEditQuestionModal(questionId) {
	const { currentQuestions } = getState();
	const question = currentQuestions.find((q) => q.id === questionId);

	elements.questionModalTitle.textContent = "Edit Question";
	elements.questionId.value = question.id;
	elements.questionQuizId.value = question.quizId;
	elements.questionText.value = question.questionText;

	clearOptionsContainer();
	question.options.forEach((opt, idx) => {
		addOptionInput(opt, idx === question.correctAnswerIndex);
	});

	showModal(elements.questionModal);
}

export async function handleQuestionFormSubmit(e) {
	e.preventDefault();

	const questionId = elements.questionId.value;
	const quizId = elements.questionQuizId.value;
	const questionText = elements.questionText.value;

	const optionInputs = document.querySelectorAll(
		'#options-container input[type="text"]'
	);
	const options = Array.from(optionInputs).map((input) => input.value);
	const correctAnswerIndex = parseInt(
		document.querySelector('input[name="correct-option"]:checked').value
	);

	const data = {
		quizId: parseInt(quizId),
		questionText,
		options,
		correctAnswerIndex,
	};

	try {
		if (questionId) {
			await updateQuestion(questionId, data);
			showAlert("Question updated successfully!", "success");
		} else {
			await createQuestion(data);
			showAlert("Question added successfully!", "success");
		}

		hideModal(elements.questionModal);
		loadQuestions();
	} catch (error) {
		console.error("Error saving question:", error);
	}
}

export async function handleDeleteQuestion(questionId) {
	if (!confirm("Are you sure you want to delete this question?")) {
		return;
	}

	try {
		await deleteQuestion(questionId);
		showAlert("Question deleted successfully!", "success");
		loadQuestions();
	} catch (error) {
		console.error("Error deleting question:", error);
	}
}

export function openImportModal() {
	showModal(elements.importModal);
	resetFileUpload();
	resetImportState();
}

export function handleFileSelect(e) {
	const file = e.target.files[0];
	if (!file) return;

	if (!file.name.endsWith(".json")) {
		showAlert("Please upload a JSON file only", "error");
		elements.importBtn.disabled = true;
		return;
	}

	const reader = new FileReader();
	reader.onload = function (event) {
		try {
			const content = event.target.result;
			const data = JSON.parse(content);

			if (validateImportData(data)) {
				setState({ importedData: data });
				elements.importBtn.disabled = false;
				elements.fileUploadArea.innerHTML = `
                    <p style="color: #10b981; margin-bottom: 10px;">✓ File loaded successfully</p>
                    <p style="color: #64748b; font-size: 0.9rem;">${data.length} questions found</p>
                `;
			} else {
				throw new Error("Invalid file format");
			}
		} catch (error) {
			showAlert(
				"Invalid JSON format. Please check the example format.",
				"error"
			);
			elements.importBtn.disabled = true;
			resetImportState();
		}
	};
	reader.readAsText(file);
}

function validateImportData(data) {
	if (!Array.isArray(data) || data.length === 0) return false;

	return data.every(
		(q) =>
			q.questionText &&
			Array.isArray(q.options) &&
			q.options.length >= 2 &&
			typeof q.correctAnswerIndex === "number" &&
			q.correctAnswerIndex >= 0 &&
			q.correctAnswerIndex < q.options.length
	);
}

export async function handleImportQuestions() {
	const quizId = elements.importQuizId.value;
	const { importedData } = getState();

	if (!quizId) {
		showAlert("Please select a quiz first", "error");
		return;
	}

	if (!importedData) {
		showAlert("Please upload a file first", "error");
		return;
	}

	try {
		const result = await importQuestions(parseInt(quizId), importedData);
		showAlert(`Successfully imported ${result.count} questions!`, "success");
		hideModal(elements.importModal);
		loadQuestions();
		resetFileUpload();
		resetImportState();
	} catch (error) {
		console.error("Error importing questions:", error);
	}
}

export function handleQuizFilterChange() {
	const { currentQuestions } = getState();
	renderQuestions(currentQuestions);
}
