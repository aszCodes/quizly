import { API_URL } from "./state.js";
import { showError } from "./dom.js";

export async function fetchQuiz() {
	try {
		const response = await fetch(`${API_URL}/quiz`);
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

		if (!response.ok) {
			throw new Error("Failed to submit quiz");
		}

		return await response.json();
	} catch (error) {
		showError("Failed to submit quiz");
		throw error;
	}
}
