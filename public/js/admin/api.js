// API calls for admin functionality
import { API_URL } from "./state.js";
import { showAlert } from "./dom.js";

// Dashboard
export async function fetchDashboardData() {
	try {
		const [quizzes, attempts] = await Promise.all([
			fetch(`${API_URL}/quiz`).then((r) => r.json()),
			fetch(`${API_URL}/attempts`).then((r) => r.json()),
		]);
		return { quizzes, attempts };
	} catch (error) {
		showAlert("Error loading dashboard data", "error");
		throw error;
	}
}

// Quizzes
export async function fetchQuizzes() {
	try {
		const response = await fetch(`${API_URL}/admin/quizzes`);
		return await response.json();
	} catch (error) {
		showAlert("Error fetching quizzes", "error");
		throw error;
	}
}

export async function createQuiz(quizData) {
	try {
		const response = await fetch(`${API_URL}/admin/quizzes`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(quizData),
		});

		if (!response.ok) throw new Error("Failed to create quiz");
		return await response.json();
	} catch (error) {
		showAlert("Error creating quiz", "error");
		throw error;
	}
}

export async function updateQuiz(quizId, quizData) {
	try {
		const response = await fetch(`${API_URL}/admin/quizzes/${quizId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(quizData),
		});

		if (!response.ok) throw new Error("Failed to update quiz");
		return await response.json();
	} catch (error) {
		showAlert("Error updating quiz", "error");
		throw error;
	}
}

export async function deleteQuiz(quizId) {
	try {
		const response = await fetch(`${API_URL}/admin/quizzes/${quizId}`, {
			method: "DELETE",
		});

		if (!response.ok) throw new Error("Failed to delete quiz");
		return await response.json();
	} catch (error) {
		showAlert("Error deleting quiz", "error");
		throw error;
	}
}

export async function activateQuiz(quizId) {
	try {
		const response = await fetch(
			`${API_URL}/admin/quizzes/${quizId}/activate`,
			{
				method: "PUT",
			}
		);

		if (!response.ok) throw new Error("Failed to activate quiz");
		return await response.json();
	} catch (error) {
		showAlert("Error activating quiz", "error");
		throw error;
	}
}

// Questions
export async function fetchQuestions() {
	try {
		const response = await fetch(`${API_URL}/admin/questions`);
		return await response.json();
	} catch (error) {
		showAlert("Error fetching questions", "error");
		throw error;
	}
}

export async function createQuestion(questionData) {
	try {
		const response = await fetch(`${API_URL}/admin/questions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(questionData),
		});

		if (!response.ok) throw new Error("Failed to create question");
		return await response.json();
	} catch (error) {
		showAlert("Error creating question", "error");
		throw error;
	}
}

export async function updateQuestion(questionId, questionData) {
	try {
		const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(questionData),
		});

		if (!response.ok) throw new Error("Failed to update question");
		return await response.json();
	} catch (error) {
		showAlert("Error updating question", "error");
		throw error;
	}
}

export async function deleteQuestion(questionId) {
	try {
		const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
			method: "DELETE",
		});

		if (!response.ok) throw new Error("Failed to delete question");
		return await response.json();
	} catch (error) {
		showAlert("Error deleting question", "error");
		throw error;
	}
}

export async function importQuestions(quizId, questions) {
	try {
		const response = await fetch(`${API_URL}/admin/questions/import`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ quizId, questions }),
		});

		if (!response.ok) throw new Error("Failed to import questions");
		return await response.json();
	} catch (error) {
		showAlert("Error importing questions", "error");
		throw error;
	}
}

// Attempts
export async function fetchAttempts() {
	try {
		const response = await fetch(`${API_URL}/attempts`);
		return await response.json();
	} catch (error) {
		showAlert("Error fetching attempts", "error");
		throw error;
	}
}
