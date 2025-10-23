import { fetchAllAttempts } from "../../db/queries/attempts.js";

export default function getAllAttempts(req, res, next) {
	try {
		const attempts = fetchAllAttempts();
		res.json(attempts);
	} catch (error) {
		next(error);
	}
}
