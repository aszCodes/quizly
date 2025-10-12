// Admin state management
export const API_URL = "/api";

let state = {
	currentQuizzes: [],
	currentQuestions: [],
	currentAttempts: [],
	importedData: null,
	activeTab: "dashboard",
};

export const getState = () => ({ ...state });

export const setState = (newState) => {
	state = { ...state, ...newState };
};

export const resetImportState = () => {
	state.importedData = null;
};
