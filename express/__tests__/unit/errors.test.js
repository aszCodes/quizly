import {
	AppError,
	ValidationError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError,
	DatabaseError,
} from "../../errors/app.error.js";
import { ErrorFactory, validateOrThrow } from "../../errors/error.factory.js";

describe("AppError Classes", () => {
	describe("AppError Base Class", () => {
		test("should create error with message, status, and code", () => {
			const error = new AppError("Test error", 418, "TEST_ERROR");

			expect(error.message).toBe("Test error");
			expect(error.statusCode).toBe(418);
			expect(error.code).toBe("TEST_ERROR");
			expect(error.isOperational).toBe(true);
			expect(error.name).toBe("AppError");
		});

		test("should have default values", () => {
			const error = new AppError("Test");

			expect(error.statusCode).toBe(500);
			expect(error.code).toBe("INTERNAL_ERROR");
		});

		test("should serialize to JSON correctly", () => {
			const error = new AppError("Test error", 400, "TEST");
			const json = error.toJSON();

			expect(json).toHaveProperty("error", "Test error");
			expect(json).toHaveProperty("code", "TEST");
			expect(json).not.toHaveProperty("stack"); // Not in test env
		});
	});

	describe("Specific Error Types", () => {
		test("ValidationError should have 400 status", () => {
			const error = new ValidationError("Invalid input");

			expect(error.statusCode).toBe(400);
			expect(error.code).toBe("VALIDATION_ERROR");
			expect(error.message).toBe("Invalid input");
		});

		test("UnauthorizedError should have 401 status", () => {
			const error = new UnauthorizedError("Not authorized");

			expect(error.statusCode).toBe(401);
			expect(error.code).toBe("UNAUTHORIZED");
		});

		test("ForbiddenError should have 403 status", () => {
			const error = new ForbiddenError("Access denied");

			expect(error.statusCode).toBe(403);
			expect(error.code).toBe("FORBIDDEN");
		});

		test("NotFoundError should have 404 status", () => {
			const error = new NotFoundError("Not found");

			expect(error.statusCode).toBe(404);
			expect(error.code).toBe("NOT_FOUND");
		});

		test("ConflictError should have 409 status", () => {
			const error = new ConflictError("Duplicate entry");

			expect(error.statusCode).toBe(409);
			expect(error.code).toBe("CONFLICT");
		});

		test("DatabaseError should have 500 status and store original error", () => {
			const original = new Error("SQL error");
			const error = new DatabaseError("DB failed", original);

			expect(error.statusCode).toBe(500);
			expect(error.code).toBe("DATABASE_ERROR");
			expect(error.originalError).toBe(original);
		});
	});
});

describe("ErrorFactory", () => {
	describe("Validation Errors", () => {
		test("missingFields should list fields", () => {
			const error = ErrorFactory.missingFields(["name", "email"]);

			expect(error).toBeInstanceOf(ValidationError);
			expect(error.message).toContain("name, email");
		});

		test("missingFields with no fields should have generic message", () => {
			const error = ErrorFactory.missingFields();

			expect(error.message).toBe("Missing required fields");
		});

		test("invalidField should include field name", () => {
			const error = ErrorFactory.invalidField("email", "invalid format");

			expect(error.message).toBe("Invalid email: invalid format");
		});

		test("invalidId should create proper error", () => {
			const error = ErrorFactory.invalidId("quiz ID");

			expect(error.message).toBe("Invalid quiz ID");
		});

		test("invalidDuration should include range", () => {
			const error = ErrorFactory.invalidDuration(1000, 10000);

			expect(error.message).toContain("1000ms");
			expect(error.message).toContain("10000ms");
		});

		test("invalidName should include length constraints", () => {
			const error = ErrorFactory.invalidName(2, 255);

			expect(error.message).toContain("2");
			expect(error.message).toContain("255");
		});
	});

	describe("Authorization Errors", () => {
		test("invalidSession should be UnauthorizedError", () => {
			const error = ErrorFactory.invalidSession();

			expect(error).toBeInstanceOf(UnauthorizedError);
			expect(error.message).toContain("Invalid session token");
		});

		test("notWhitelisted should be ForbiddenError", () => {
			const error = ErrorFactory.notWhitelisted();

			expect(error).toBeInstanceOf(ForbiddenError);
			expect(error.message).toContain("class roster");
		});
	});

	describe("Not Found Errors", () => {
		test("notFound should accept resource type", () => {
			const error = ErrorFactory.notFound("Quiz");

			expect(error).toBeInstanceOf(NotFoundError);
			expect(error.message).toBe("Quiz not found");
		});

		test("noActiveQuestion should have specific message", () => {
			const error = ErrorFactory.noActiveQuestion();

			expect(error.message).toBe("No active question found");
		});
	});

	describe("Conflict Errors", () => {
		test("alreadyAttempted should accept resource type", () => {
			const error = ErrorFactory.alreadyAttempted("quiz");

			expect(error).toBeInstanceOf(ConflictError);
			expect(error.message).toBe("You have already attempted this quiz");
		});
	});
});

describe("validateOrThrow", () => {
	describe("requiredFields", () => {
		test("should not throw when all fields present", () => {
			const data = { name: "John", email: "john@test.com" };

			expect(() => {
				validateOrThrow.requiredFields(data, ["name", "email"]);
			}).not.toThrow();
		});

		test("should throw when field is missing", () => {
			const data = { name: "John" };

			expect(() => {
				validateOrThrow.requiredFields(data, ["name", "email"]);
			}).toThrow(ValidationError);
		});

		test("should throw when field is null", () => {
			const data = { name: "John", email: null };

			expect(() => {
				validateOrThrow.requiredFields(data, ["name", "email"]);
			}).toThrow(ValidationError);
		});

		test("should throw when field is undefined", () => {
			const data = { name: "John", email: undefined };

			expect(() => {
				validateOrThrow.requiredFields(data, ["name", "email"]);
			}).toThrow(ValidationError);
		});
	});

	describe("positiveInteger", () => {
		test("should not throw for valid positive integer", () => {
			expect(() => {
				validateOrThrow.positiveInteger(5, "ID");
			}).not.toThrow();
		});

		test("should throw for zero", () => {
			expect(() => {
				validateOrThrow.positiveInteger(0, "ID");
			}).toThrow(ValidationError);
		});

		test("should throw for negative number", () => {
			expect(() => {
				validateOrThrow.positiveInteger(-5, "ID");
			}).toThrow(ValidationError);
		});

		test("should throw for NaN", () => {
			expect(() => {
				validateOrThrow.positiveInteger(NaN, "ID");
			}).toThrow(ValidationError);
		});

		test("should throw for non-number", () => {
			expect(() => {
				validateOrThrow.positiveInteger("5", "ID");
			}).toThrow(ValidationError);
		});
	});

	describe("stringLength", () => {
		test("should trim and return valid string", () => {
			const result = validateOrThrow.stringLength(
				"  John  ",
				"name",
				2,
				10
			);

			expect(result).toBe("John");
		});

		test("should throw for non-string", () => {
			expect(() => {
				validateOrThrow.stringLength(123, "name", 2, 10);
			}).toThrow(ValidationError);
		});

		test("should throw for string too short", () => {
			expect(() => {
				validateOrThrow.stringLength("A", "name", 2, 10);
			}).toThrow(ValidationError);
		});

		test("should throw for string too long", () => {
			expect(() => {
				validateOrThrow.stringLength("A".repeat(11), "name", 2, 10);
			}).toThrow(ValidationError);
		});
	});

	describe("duration", () => {
		test("should not throw for valid duration", () => {
			expect(() => {
				validateOrThrow.duration(5000, 1000, 10000);
			}).not.toThrow();
		});

		test("should throw for non-number", () => {
			expect(() => {
				validateOrThrow.duration("5000", 1000, 10000);
			}).toThrow(ValidationError);
		});

		test("should throw for zero", () => {
			expect(() => {
				validateOrThrow.duration(0, 1000, 10000);
			}).toThrow(ValidationError);
		});

		test("should throw for negative", () => {
			expect(() => {
				validateOrThrow.duration(-100, 1000, 10000);
			}).toThrow(ValidationError);
		});

		test("should throw for exceeding max", () => {
			expect(() => {
				validateOrThrow.duration(15000, 1000, 10000);
			}).toThrow(ValidationError);
		});
	});

	describe("section", () => {
		test("should trim and return valid section", () => {
			const result = validateOrThrow.section("  IT - A  ");

			expect(result).toBe("IT - A");
		});

		test("should throw for null", () => {
			expect(() => {
				validateOrThrow.section(null);
			}).toThrow(ValidationError);
		});

		test("should throw for empty string", () => {
			expect(() => {
				validateOrThrow.section("   ");
			}).toThrow(ValidationError);
		});

		test("should throw for undefined", () => {
			expect(() => {
				validateOrThrow.section(undefined);
			}).toThrow(ValidationError);
		});
	});

	describe("exists", () => {
		test("should return resource if exists", () => {
			const resource = { id: 1, name: "Test" };
			const result = validateOrThrow.exists(resource, "Quiz");

			expect(result).toBe(resource);
		});

		test("should throw if resource is null", () => {
			expect(() => {
				validateOrThrow.exists(null, "Quiz");
			}).toThrow(NotFoundError);
		});

		test("should throw if resource is undefined", () => {
			expect(() => {
				validateOrThrow.exists(undefined, "Quiz");
			}).toThrow(NotFoundError);
		});

		test("should use custom resource type in error", () => {
			try {
				validateOrThrow.exists(null, "Custom Resource");
			} catch (error) {
				expect(error.message).toContain("Custom Resource");
			}
		});
	});

	describe("whitelisted", () => {
		test("should return student if whitelisted", () => {
			const student = { id: 1, name: "John" };
			const result = validateOrThrow.whitelisted(student);

			expect(result).toBe(student);
		});

		test("should throw ForbiddenError if not whitelisted", () => {
			expect(() => {
				validateOrThrow.whitelisted(null);
			}).toThrow(ForbiddenError);
		});
	});

	describe("validSession", () => {
		test("should return session if valid", () => {
			const session = { id: 1, token: "abc" };
			const result = validateOrThrow.validSession(session, true);

			expect(result).toBe(session);
		});

		test("should throw if session is null", () => {
			expect(() => {
				validateOrThrow.validSession(null, true);
			}).toThrow(UnauthorizedError);
		});

		test("should throw if session is invalid", () => {
			const session = { id: 1, token: "abc" };

			expect(() => {
				validateOrThrow.validSession(session, false);
			}).toThrow(UnauthorizedError);
		});
	});

	describe("notAttempted", () => {
		test("should not throw if not attempted", () => {
			expect(() => {
				validateOrThrow.notAttempted(false, "quiz");
			}).not.toThrow();
		});

		test("should throw ConflictError if already attempted", () => {
			expect(() => {
				validateOrThrow.notAttempted(true, "quiz");
			}).toThrow(ConflictError);
		});
	});
});
