import { HTTP_STATUS } from "../config/constants.js";

export default function notFound(req, res, next) {
	res.status(HTTP_STATUS.NOT_FOUND).render(`${HTTP_STATUS.NOT_FOUND}`, {
		url: req.originalUrl,
	});
}
