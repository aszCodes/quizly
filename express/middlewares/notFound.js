export default function notFound(req, res, next) {
	res.status(404).render("404", { url: req.originalUrl });
}
