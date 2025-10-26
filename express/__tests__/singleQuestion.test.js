import request from "supertest";
import app from "../index.js";
import { createTestQuestion } from "./testUtils.js";

describe("GET /api/question", () => {
	it("should return 404 when no active question exists", async () => {
		const res = await request(app).get("/api/question");

		expect(res.status).toBe(404);
		expect(res.body.error).toBe("No active question found");
	});

	it("should return active question", async () => {
		createTestQuestion({
			question_text: "What is 2+2?",
			correct_answer: "4",
			options: ["2", "3", "4", "5"],
			is_active: 1,
		});

		const res = await request(app).get("/api/question");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("id");
		expect(res.body.question_text).toBe("What is 2+2?");
		expect(res.body.options).toEqual(["2", "3", "4", "5"]);
	});
});
