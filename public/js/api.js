import { API_URL } from "./state.js";
import { showError } from "./dom.js";

export async function fetchQuiz() {
	try {
		const response = await fetch(`${API_URL}/quiz`);

		if (!response.ok) {
			throw new Error("Failed to load quiz");
		}

		const data = await response.json();
		return data[0];
	} catch (error) {
		showError("Failed to load quiz");
		throw error;
	}
}

export async function fetchQuestions() {
	try {
		const response = await fetch(`${API_URL}/questions`);

		if (!response.ok) {
			throw new Error("Failed to load questions");
		}

		return await response.json();
	} catch (error) {
		showError("Failed to load questions");
		throw error;
	}
}

export async function submitQuiz(quizId, studentName, answers) {
	try {
		const response = await fetch(`${API_URL}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ quizId, studentName, answers }),
		});

		const data = await response.json();

		if (!response.ok) {
			const errorMessage =
				data.error || data.message || "Failed to submit quiz";
			showError(errorMessage);
			throw new Error(errorMessage);
		}

		return data;
	} catch (error) {
		if (!error.message.includes("Maximum attempts")) {
			showError(error.message || "Failed to submit quiz");
		}
		throw error;
	}
}
