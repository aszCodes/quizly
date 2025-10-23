export function getQuiz(req, res) {
	const studentName = req.query.name || "Guest";

	if (!studentName || studentName === "Guest") {
		return res.redirect("/");
	}

	res.render("quiz", {
		title: "Quizly",
		studentName: studentName,
	});
}

export function selectQuiz(req, res) {
	const studentName = req.query.name || "Guest";
	if (!studentName || studentName === "Guest") {
		return res.redirect("/");
	}
	res.render("selectQuiz", {
		title: "Quizly",
		studentName: studentName,
	});
}
