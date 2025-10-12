// Dashboard functionality
import { fetchDashboardData } from "./api.js";
import { elements } from "./dom.js";

export async function loadDashboard() {
	try {
		const { quizzes, attempts } = await fetchDashboardData();

		const activeQuiz = quizzes.find((q) => q.isActive);
		const totalAttempts = attempts.length;
		const averageScore =
			attempts.length > 0
				? (
						attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
				  ).toFixed(1)
				: 0;

		elements.statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${quizzes.length}</div>
                <div class="stat-label">Total Quizzes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalAttempts}</div>
                <div class="stat-label">Total Attempts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${averageScore}</div>
                <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${activeQuiz ? "✓" : "✗"}</div>
                <div class="stat-label">Active Quiz</div>
            </div>
        `;

		renderRecentAttempts(attempts);
	} catch (error) {
		console.error("Error loading dashboard:", error);
	}
}

function renderRecentAttempts(attempts) {
	const recentAttempts = attempts.slice(0, 5);

	elements.recentAttempts.innerHTML =
		recentAttempts.length > 0
			? `<div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentAttempts
											.map(
												(a) => `
                        <tr>
                            <td>${a.studentName}</td>
                            <td>${a.score}/${a.totalQuestions} (${Math.round(
													(a.score / a.totalQuestions) * 100
												)}%)</td>
                            <td>${new Date(a.completedAt).toLocaleString()}</td>
                        </tr>
                    `
											)
											.join("")}
                </tbody>
            </table>
        </div>`
			: '<p style="color: #64748b;">No attempts yet</p>';
}
