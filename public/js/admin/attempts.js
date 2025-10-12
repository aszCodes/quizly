// Attempts management functionality
import { fetchAttempts } from "./api.js";
import { elements, showAlert } from "./dom.js";
import { getState, setState } from "./state.js";

export async function loadAttempts() {
	try {
		const attempts = await fetchAttempts();
		setState({ currentAttempts: attempts });

		renderAttempts(attempts);
	} catch (error) {
		console.error("Error loading attempts:", error);
	}
}

function renderAttempts(attempts) {
	const { currentQuizzes } = getState();
	const quizId = elements.attemptsQuizFilter.value;
	const filtered = quizId
		? attempts.filter((a) => a.quizId == quizId)
		: attempts;

	elements.attemptsTable.innerHTML =
		filtered.length > 0
			? filtered
					.map((attempt) => {
						const quiz =
							currentQuizzes.find((q) => q.id === attempt.quizId) || {};
						const percentage = Math.round(
							(attempt.score / attempt.totalQuestions) * 100
						);

						return `
                <tr>
                    <td>${attempt.studentName}</td>
                    <td>${quiz.title || "Unknown Quiz"}</td>
                    <td>${attempt.score}/${attempt.totalQuestions}</td>
                    <td>${percentage}%</td>
                    <td>${new Date(attempt.completedAt).toLocaleString()}</td>
                </tr>
            `;
					})
					.join("")
			: '<tr><td colspan="5" style="text-align: center; color: #64748b;">No attempts found</td></tr>';
}

export function handleAttemptsFilterChange() {
	const { currentAttempts } = getState();
	renderAttempts(currentAttempts);
}

export function handleExportAttempts() {
	const { currentAttempts, currentQuizzes } = getState();
	const quizId = elements.attemptsQuizFilter.value;
	const filtered = quizId
		? currentAttempts.filter((a) => a.quizId == quizId)
		: currentAttempts;

	if (filtered.length === 0) {
		showAlert("No attempts to export", "error");
		return;
	}

	const csv = [
		["Student Name", "Quiz", "Score", "Total Questions", "Percentage", "Date"],
		...filtered.map((a) => {
			const quiz = currentQuizzes.find((q) => q.id === a.quizId) || {};
			const percentage = Math.round((a.score / a.totalQuestions) * 100);
			return [
				a.studentName,
				quiz.title || "Unknown",
				a.score,
				a.totalQuestions,
				percentage + "%",
				new Date(a.completedAt).toLocaleString(),
			];
		}),
	]
		.map((row) => row.join(","))
		.join("\n");

	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `quiz-attempts-${Date.now()}.csv`;
	a.click();
	URL.revokeObjectURL(url);

	showAlert("Attempts exported successfully!", "success");
}
