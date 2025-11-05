/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

// HTTP Status Codes
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
};

// Error Codes
export const ERROR_CODES = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	DATABASE_ERROR: "DATABASE_ERROR",
	INTERNAL_ERROR: "INTERNAL_ERROR",
};

// Scoring
export const SCORING = {
	CORRECT_ANSWER: 10,
	INCORRECT_ANSWER: 0,
	QUIZ_CORRECT_ANSWER: 1,
	QUIZ_INCORRECT_ANSWER: 0,
};

// Time Limits (milliseconds)
export const TIME_LIMITS = {
	SINGLE_QUESTION_DURATION: 60 * 60 * 1000, // 60 minutes
	SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
	MIN_QUESTION_TIME: 1000, // 1 second
	MAX_QUESTION_TIME: 10 * 60 * 1000, // 10 minutes
};

// Validation Constraints
export const VALIDATION = {
	MIN_NAME_LENGTH: 2,
	MAX_NAME_LENGTH: 255,
};

// Database Settings
export const DATABASE = {
	DEFAULT_LEADERBOARD_LIMIT: 5,
	SQLITE_ERROR_CODE: "SQLITE_ERROR",
	SQLITE_ERROR_NAME: "SqliteError",
};

// Log Categories
export const LOG_CATEGORIES = {
	HTTP: "http",
	DATABASE: "database",
	SERVICE: "service",
	AUTH: "auth",
	VALIDATION: "validation",
	ERROR: "error",
};

// Environment Names
export const ENVIRONMENTS = {
	DEVELOPMENT: "development",
	PRODUCTION: "production",
	TEST: "test",
};
