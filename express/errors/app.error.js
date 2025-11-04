export class AppError extends Error {
	constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			error: this.message,
			code: this.code,
			...(process.env.NODE_ENV === "development" && {
				stack: this.stack,
			}),
		};
	}
}

/**
 * 400 Bad Request - Invalid input
 */
export class ValidationError extends AppError {
	constructor(message = "Validation failed") {
		super(message, 400, "VALIDATION_ERROR");
	}
}

/**
 * 401 Unauthorized - Invalid credentials/token
 */
export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized access") {
		super(message, 401, "UNAUTHORIZED");
	}
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends AppError {
	constructor(message = "Access forbidden") {
		super(message, 403, "FORBIDDEN");
	}
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404, "NOT_FOUND");
	}
}

/**
 * 409 Conflict - Resource conflict (duplicate, etc)
 */
export class ConflictError extends AppError {
	constructor(message = "Resource conflict") {
		super(message, 409, "CONFLICT");
	}
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends AppError {
	constructor(message = "Internal server error") {
		super(message, 500, "INTERNAL_ERROR");
	}
}

/**
 * Database-specific error
 */
export class DatabaseError extends AppError {
	constructor(message = "Database operation failed", originalError = null) {
		super(message, 500, "DATABASE_ERROR");
		this.originalError = originalError;
	}
}
