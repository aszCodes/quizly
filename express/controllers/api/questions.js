import { getActiveSingleQuestion } from "../../db/queries/questions.js";

/**
 * GET /api/question - Get active single question
 */
export default function getQuestion(req, res, next) {
	try {
		const question = getActiveSingleQuestion();

		if (!question) {
			return res.status(404).json({
				error: "No active question found",
			});
		}

		// Parse options from JSON string
		const options = question.options ? JSON.parse(question.options) : [];

		// Return question without the correct answer
		res.json({
			id: question.id,
			questionText: question.question_text,
			options: options,
		});
	} catch (error) {
		next(error);
	}
}
