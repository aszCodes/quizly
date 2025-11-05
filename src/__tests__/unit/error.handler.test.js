import { jest } from "@jest/globals";
import errorHandler, { asyncHandler } from "../../middlewares/error.handler.js";
import {
	ValidationError,
	NotFoundError,
	DatabaseError,
	ConflictError,
} from "../../errors/app.error.js";

describe("Error Handler Middleware", () => {
	let req, res, next;

	beforeEach(() => {
		req = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		next = jest.fn();
	});

	describe("AppError handling", () => {
		it("should handle ValidationError with correct status and response", () => {
			const error = new ValidationError("Invalid input");

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid input",
				code: "VALIDATION_ERROR",
			});
		});

		it("should handle NotFoundError with correct status and response", () => {
			const error = new NotFoundError("Resource not found");

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				error: "Resource not found",
				code: "NOT_FOUND",
			});
		});

		it("should handle ConflictError with correct status and response", () => {
			const error = new ConflictError("Duplicate entry");

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({
				error: "Duplicate entry",
				code: "CONFLICT",
			});
		});

		it("should handle DatabaseError with correct status and response", () => {
			const error = new DatabaseError("Query failed");

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Query failed",
				code: "DATABASE_ERROR",
			});
		});

		it("should include stack trace in development mode", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			const error = new ValidationError("Test error");
			errorHandler(error, req, res, next);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Test error",
					code: "VALIDATION_ERROR",
					stack: expect.any(String),
				})
			);

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe("SQLite/Database error handling", () => {
		it("should handle SQLITE_ERROR code", () => {
			const error = new Error("SQLITE constraint failed");
			error.code = "SQLITE_ERROR";

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Database operation failed",
				code: "DATABASE_ERROR",
			});
		});

		it("should handle SqliteError by name", () => {
			const error = new Error("Database locked");
			error.name = "SqliteError";

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Database operation failed",
				code: "DATABASE_ERROR",
			});
		});
	});

	describe("Unknown/Generic error handling", () => {
		it("should handle generic errors with 500 status", () => {
			const error = new Error("Something went wrong");

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Something went wrong",
				code: "INTERNAL_ERROR",
			});
		});

		it("should handle errors with custom statusCode", () => {
			const error = new Error("Custom error");
			error.statusCode = 418;

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(418);
			expect(res.json).toHaveBeenCalledWith({
				error: "Custom error",
				code: "INTERNAL_ERROR",
			});
		});

		it("should use default message for errors without message", () => {
			const error = new Error();

			errorHandler(error, req, res, next);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Internal server error",
				code: "INTERNAL_ERROR",
			});
		});

		it("should include stack trace in development mode for generic errors", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			const error = new Error("Generic error");
			errorHandler(error, req, res, next);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Generic error",
					code: "INTERNAL_ERROR",
					stack: expect.any(String),
				})
			);

			process.env.NODE_ENV = originalEnv;
		});

		it("should NOT include stack trace in production mode", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			const error = new Error("Production error");
			errorHandler(error, req, res, next);

			expect(res.json).toHaveBeenCalledWith({
				error: "Production error",
				code: "INTERNAL_ERROR",
			});

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe("Logging behavior", () => {
		let consoleErrorSpy;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it("should not log errors in test environment", () => {
			const error = new ValidationError("Test error");

			errorHandler(error, req, res, next);

			expect(consoleErrorSpy).not.toHaveBeenCalled();
		});

		it("should log errors outside test environment", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			const error = new ValidationError("Dev error");
			errorHandler(error, req, res, next);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error caught by handler:",
				expect.objectContaining({
					name: "ValidationError",
					message: "Dev error",
					code: "VALIDATION_ERROR",
					statusCode: 400,
				})
			);

			process.env.NODE_ENV = originalEnv;
		});
	});
});

describe("asyncHandler", () => {
	let req, res, next;

	beforeEach(() => {
		req = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		next = jest.fn();
	});

	it("should call the async function and resolve successfully", async () => {
		const asyncFn = jest.fn().mockResolvedValue("success");
		const wrappedFn = asyncHandler(asyncFn);

		await wrappedFn(req, res, next);

		expect(asyncFn).toHaveBeenCalledWith(req, res, next);
		expect(next).not.toHaveBeenCalled();
	});

	it("should catch errors and pass them to next()", async () => {
		const error = new Error("Async error");
		const asyncFn = jest.fn().mockRejectedValue(error);
		const wrappedFn = asyncHandler(asyncFn);

		await wrappedFn(req, res, next);

		expect(asyncFn).toHaveBeenCalledWith(req, res, next);
		expect(next).toHaveBeenCalledWith(error);
	});

	it("should handle validation errors thrown in async functions", async () => {
		const error = new ValidationError("Invalid data");
		const asyncFn = jest.fn().mockRejectedValue(error);
		const wrappedFn = asyncHandler(asyncFn);

		await wrappedFn(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(error).toBeInstanceOf(ValidationError);
	});

	it("should handle synchronous returns", async () => {
		const asyncFn = jest.fn().mockReturnValue("sync result");
		const wrappedFn = asyncHandler(asyncFn);

		await wrappedFn(req, res, next);

		expect(asyncFn).toHaveBeenCalledWith(req, res, next);
		expect(next).not.toHaveBeenCalled();
	});

	it("should pass through req, res, next parameters", async () => {
		const asyncFn = jest.fn(async (request, response, nextFn) => {
			expect(request).toBe(req);
			expect(response).toBe(res);
			expect(nextFn).toBe(next);
		});
		const wrappedFn = asyncHandler(asyncFn);

		await wrappedFn(req, res, next);

		expect(asyncFn).toHaveBeenCalledWith(req, res, next);
	});
});
