const sampleAttempts = {
	id: 1,
	studentName: "Miller",
	answers: [0, 1, 2, 0, 1],
	score: 4,
	duration: 120,
};

export default function getAttempts(req, res) {
	res.json(sampleAttempts);
}
