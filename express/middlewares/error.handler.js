import { AppError, DatabaseError } from "../errors/app.error";

export default function errorHandler(err, req, res, next) {
	// Log errors outside of test environment
	if (process.env.NODE_ENV !== "test") {
		console.error("Error caught by handler:", {
			name: err.name,
			message: err.message,
			code: err.code,
			statusCode: err.statusCode,
			stack: err.stack,
		});
	}

	// Handle operational errors
	if (err instanceof AppError) {
		return res.status(err.statusCode).json(err.toJSON());
	}

	// Handle SQLite/Database errors
	if (err.code === "SQLITE_ERROR" || err.name === "SqliteError") {
		const dbError = new DatabaseError("Database operation failed", err);
		return res.status(dbError.statusCode).json(dbError.toJSON());
	}

	// Handle unknown/programming errors
	const statusCode = err.statusCode || 500;
	const response = {
		error: err.message || "Internal server error",
		code: "INTERNAL_ERROR",
	};

	// Include stack trace in development only
	if (process.env.NODE_ENV === "development") {
		response.stack = err.stack;
	}

	res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 *
 * @example
 * app.get('/api/resource', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
export const asyncHandler = fn => {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};
