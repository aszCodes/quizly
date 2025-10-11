import { getAllAttempts } from "../db/services.js";
import sendJSON from "../utils/sendJSON.js";

const attemptsHandler = (req, res) => {
	try {
		const attempts = getAllAttempts();
		sendJSON(res, 200, attempts);
	} catch (error) {
		console.error("Error fetching attempts:", error);
		sendJSON(res, 500, { error: "Failed to fetch attempts" });
	}
};

export default attemptsHandler;
