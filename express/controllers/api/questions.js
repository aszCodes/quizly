const sampleQuestion = {
	questionText: "Testing",
	options: ["A", "B", "C", "D"],
};

export default function getQuestions(req, res) {
	res.json(sampleQuestion);
}
