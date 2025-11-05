import { HTTP_STATUS, ERROR_CODES, ENVIRONMENTS } from "../config/constants.js";

export class AppError extends Error {
	constructor(
		message,
		statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
		code = ERROR_CODES.INTERNAL_ERROR,
		isOperational = true,
		originalError = null
	) {
		super(message);

		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.isOperational = isOperational;
		this.originalError = originalError;

		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		const response = {
			error: this.message,
			code: this.code,
		};

		// Include stack trace and original error in development
		if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT) {
			response.stack = this.stack;
			if (this.originalError) {
				response.original = this.originalError.message;
			}
		}

		return response;
	}
}

/**
 * 400 Bad Request - Invalid input
 */
export class ValidationError extends AppError {
	constructor(message = "Validation failed") {
		super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
	}
}

/**
 * 401 Unauthorized - Invalid credentials/token
 */
export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized access") {
		super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
	}
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends AppError {
	constructor(message = "Access forbidden") {
		super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
	}
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
	}
}

/**
 * 409 Conflict - Resource conflict (duplicate, etc)
 */
export class ConflictError extends AppError {
	constructor(message = "Resource conflict") {
		super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
	}
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends AppError {
	constructor(message = "Internal server error", originalError = null) {
		super(
			message,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			ERROR_CODES.INTERNAL_ERROR,
			false,
			originalError
		);
	}
}

/**
 * Database-specific error
 */
export class DatabaseError extends AppError {
	constructor(message = "Database operation failed", originalError = null) {
		super(
			message,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			ERROR_CODES.DATABASE_ERROR,
			true,
			originalError
		);
	}
}
