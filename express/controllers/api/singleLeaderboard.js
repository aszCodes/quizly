import { fetchSingleQuestionLeaderboard } from "../../db/queries/attempts.js";

/**
 * GET /api/leaderboard - Get single question attempts
 */
export default function getSingleAttempts(req, res, next) {
	try {
		const attempts = fetchSingleQuestionLeaderboard();
		res.json(attempts);
	} catch (error) {
		next(error);
	}
}
