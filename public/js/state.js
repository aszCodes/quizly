// Configuration
export const API_URL = "/api";

// State
let state = {
	quiz: null,
	questions: [],
	studentName: "",
	answers: [],
	timeLeft: 0,
	timerInterval: null,
};

export const getState = () => ({ ...state });
export const setState = (newState) => {
	state = { ...state, ...newState };
};
export const resetState = () => {
	if (state.timerInterval) {
		clearInterval(state.timerInterval);
	}
	state = {
		quiz: null,
		questions: [],
		studentName: "",
		answers: [],
		timeLeft: 0,
		timerInterval: null,
	};
};
