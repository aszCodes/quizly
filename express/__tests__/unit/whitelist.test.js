import request from "supertest";
import app from "../../server.js";
import { addTestStudentToWhitelist } from "../testUtils.js";

describe("Whitelist Routes", () => {
	describe("GET /api/whitelist/students", () => {
		test("should return empty array when no whitelisted students", async () => {
			const res = await request(app).get("/api/whitelist/students");

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		test("should return all whitelisted students", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - B");
			addTestStudentToWhitelist("Charlie", "IT - A");

			const res = await request(app).get("/api/whitelist/students");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(3);
			expect(res.body[0]).toHaveProperty("id");
			expect(res.body[0]).toHaveProperty("name");
			expect(res.body[0]).toHaveProperty("section");
			expect(res.body[0]).toHaveProperty("is_active");
			expect(res.body[0]).toHaveProperty("created_at");
		});

		test("should order students by section, then name", async () => {
			addTestStudentToWhitelist("Charlie", "IT - B");
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - A");

			const res = await request(app).get("/api/whitelist/students");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(3);
			// First section IT - A
			expect(res.body[0].section).toBe("IT - A");
			expect(res.body[0].name).toBe("Alice");
			expect(res.body[1].section).toBe("IT - A");
			expect(res.body[1].name).toBe("Bob");
			// Then section IT - B
			expect(res.body[2].section).toBe("IT - B");
			expect(res.body[2].name).toBe("Charlie");
		});

		test("should only return active students", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - A");

			const res = await request(app).get("/api/whitelist/students");

			expect(res.status).toBe(200);
			// Should only return students with is_active = 1
			res.body.forEach(student => {
				expect(student.is_active).toBe(1);
			});
		});
	});

	describe("GET /api/whitelist/sections", () => {
		test("should return empty array when no sections", async () => {
			const res = await request(app).get("/api/whitelist/sections");

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		test("should return unique sections", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - B");
			addTestStudentToWhitelist("Charlie", "IT - A");
			addTestStudentToWhitelist("David", "IT - C");

			const res = await request(app).get("/api/whitelist/sections");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(["IT - A", "IT - B", "IT - C"]);
		});

		test("should return sections in alphabetical order", async () => {
			addTestStudentToWhitelist("Alice", "IT - C");
			addTestStudentToWhitelist("Bob", "IT - A");
			addTestStudentToWhitelist("Charlie", "IT - B");

			const res = await request(app).get("/api/whitelist/sections");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(["IT - A", "IT - B", "IT - C"]);
		});

		test("should not return duplicate sections", async () => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - A");
			addTestStudentToWhitelist("Charlie", "IT - A");

			const res = await request(app).get("/api/whitelist/sections");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(["IT - A"]);
		});
	});

	describe("GET /api/whitelist/sections/:section/students", () => {
		beforeEach(() => {
			addTestStudentToWhitelist("Alice", "IT - A");
			addTestStudentToWhitelist("Bob", "IT - A");
			addTestStudentToWhitelist("Charlie", "IT - B");
			addTestStudentToWhitelist("David", "IT - B");
		});

		test("should return students for specific section", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/IT - A/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
			expect(res.body[0].name).toBe("Alice");
			expect(res.body[0].section).toBe("IT - A");
			expect(res.body[1].name).toBe("Bob");
			expect(res.body[1].section).toBe("IT - A");
		});

		test("should return empty array for section with no students", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/IT - C/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		test("should order students by name", async () => {
			addTestStudentToWhitelist("Zoe", "IT - C");
			addTestStudentToWhitelist("Adam", "IT - C");
			addTestStudentToWhitelist("Mike", "IT - C");

			const res = await request(app).get(
				"/api/whitelist/sections/IT - C/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(3);
			expect(res.body[0].name).toBe("Adam");
			expect(res.body[1].name).toBe("Mike");
			expect(res.body[2].name).toBe("Zoe");
		});

		test("should handle URL encoded section names", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/IT%20-%20A/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
		});

		test("should be case-insensitive", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/it - a/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
		});

		test("should only return active students in section", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/IT - A/students"
			);

			expect(res.status).toBe(200);
			res.body.forEach(student => {
				expect(student.is_active).toBe(1);
			});
		});

		test("should handle sections with special characters", async () => {
			addTestStudentToWhitelist("Emma", "CS - 3A");
			addTestStudentToWhitelist("Frank", "CS - 3A");

			const res = await request(app).get(
				"/api/whitelist/sections/CS - 3A/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
		});

		test("should not return students from other sections", async () => {
			const res = await request(app).get(
				"/api/whitelist/sections/IT - A/students"
			);

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);

			// Verify no IT - B students
			res.body.forEach(student => {
				expect(student.section).toBe("IT - A");
			});
		});
	});
});
