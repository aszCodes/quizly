export default function getHome(req, res) {
	res.render("index", {
		title: "Quizly",
		description: "Description of Quiz",
	});
}
