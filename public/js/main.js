import { elements } from "./dom.js";
import { startQuiz, submitQuiz } from "./quiz.js";

// Event listeners
elements.startBtn.addEventListener("click", startQuiz);
elements.submitBtn.addEventListener("click", submitQuiz);
elements.studentNameInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") startQuiz();
});

console.log("Quiz app initialized");
