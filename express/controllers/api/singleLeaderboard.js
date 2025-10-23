import { fetchSingleQuestionLeaderboard } from "../../db/queries/attempts.js";

/**
 * GET /api/leaderboard - Get single question leaderboard
 */
export default function getSingleLeaderboard(req, res, next) {
	try {
		const leaderboard = fetchSingleQuestionLeaderboard();
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
}
