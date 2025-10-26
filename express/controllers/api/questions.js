import { fetchSingleQuestion } from "../../db/queries/questions.js";

/**
 * GET /api/question - Get active single question
 */
export const getQuestion = (req, res, next) => {
	try {
		const question = fetchSingleQuestion();

		if (!question) {
			return res.status(404).json({ error: "No active question found" });
		}

		const { id, question_text, options } = question;
		res.json({ id, question_text, options });
	} catch (error) {
		next(error);
	}
};
