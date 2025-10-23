import { fetchQuizLeaderboard } from "../../db/queries/attempts.js";

/**
 * GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
 */
export default function getQuizLeaderboard(req, res, next) {
	try {
		const quiz_id = Number(req.params.id);
		const leaderboard = fetchQuizLeaderboard(quiz_id);
		res.json(leaderboard);
	} catch (error) {
		next(error);
	}
}
