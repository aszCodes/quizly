import * as appError from "./app.error.js";

/**
 * Factory for creating consistent error messages
 */
export const ErrorFactory = {
	// VALIDATION ERRORS (400)

	missingFields: (fields = []) => {
		const fieldList = fields.length > 0 ? `: ${fields.join(", ")}` : "";
		return new appError.ValidationError(
			`Missing required fields${fieldList}`
		);
	},

	invalidField: (fieldName, reason = "") => {
		const message = reason
			? `Invalid ${fieldName}: ${reason}`
			: `Invalid ${fieldName}`;
		return new appError.ValidationError(message);
	},

	invalidId: (resourceType = "ID") => {
		return new appError.ValidationError(`Invalid ${resourceType}`);
	},

	invalidDuration: (min, max) => {
		return new appError.ValidationError(
			`Duration must be between ${min}ms and ${max}ms`
		);
	},

	invalidName: (minLength, maxLength) => {
		return new appError.ValidationError(
			`Name must be between ${minLength} and ${maxLength} characters`
		);
	},

	sectionRequired: () => {
		return new appError.ValidationError("Section is required");
	},

	questionIdMismatch: () => {
		return new appError.ValidationError("Question ID mismatch");
	},

	quizIdMismatch: () => {
		return new appError.ValidationError("Quiz ID mismatch");
	},

	alreadyAnswered: () => {
		return new appError.ValidationError("Question already answered");
	},

	notViewed: () => {
		return new appError.ValidationError("Question was not viewed");
	},

	answerTooQuick: () => {
		return new appError.ValidationError("Answer submitted too quickly");
	},

	answerTooSlow: () => {
		return new appError.ValidationError(
			"Answer took too long (session may have expired)"
		);
	},

	quizPartOfQuestion: () => {
		return new appError.ValidationError(
			"This question is part of a quiz. Use the quiz submission endpoint."
		);
	},

	// UNAUTHORIZED ERRORS (401)

	invalidSession: () => {
		return new appError.UnauthorizedError("Invalid session token");
	},

	expiredSession: () => {
		return new appError.UnauthorizedError("Session expired or completed");
	},

	missingSession: () => {
		return new appError.ValidationError("Missing session token");
	},

	// FORBIDDEN ERRORS (403)

	notWhitelisted: () => {
		return new appError.ForbiddenError(
			"Student not found in class roster. Please verify your name and section with your teacher."
		);
	},

	// ============================================
	// NOT FOUND ERRORS (404)
	// ============================================

	notFound: (resourceType = "Resource") => {
		return new appError.NotFoundError(`${resourceType} not found`);
	},

	noActiveQuestion: () => {
		return new appError.NotFoundError("No active question found");
	},

	noQuestions: (resourceType = "quiz") => {
		return new appError.NotFoundError(
			`No questions found for this ${resourceType}`
		);
	},

	// CONFLICT ERRORS (409)

	alreadyAttempted: (resourceType = "question") => {
		return new appError.ConflictError(
			`You have already attempted this ${resourceType}`
		);
	},

	// DATABASE ERRORS (500)

	databaseError: (operation, originalError = null) => {
		return new appError.DatabaseError(
			`Database ${operation} failed`,
			originalError
		);
	},
};

/**
 * Helper to validate and throw if invalid
 */
export const validateOrThrow = {
	/**
	 * Validate required fields exist and are not null/undefined
	 */
	requiredFields: (data, fields) => {
		const missing = fields.filter(
			field => data[field] === undefined || data[field] === null
		);

		if (missing.length > 0) {
			throw ErrorFactory.missingFields(missing);
		}
	},

	/**
	 * Validate positive integer ID
	 */
	positiveInteger: (value, fieldName = "ID") => {
		if (typeof value !== "number" || isNaN(value) || value <= 0) {
			throw ErrorFactory.invalidId(fieldName);
		}
	},

	/**
	 * Validate string length
	 */
	stringLength: (value, fieldName, min, max) => {
		if (typeof value !== "string") {
			throw ErrorFactory.invalidField(fieldName, "must be a string");
		}

		const trimmed = value.trim();
		if (trimmed.length < min || trimmed.length > max) {
			throw ErrorFactory.invalidName(min, max);
		}

		return trimmed;
	},

	/**
	 * Validate duration range
	 */
	duration: (value, min, max) => {
		if (typeof value !== "number" || isNaN(value)) {
			throw ErrorFactory.invalidField("duration", "must be a number");
		}

		if (value <= 0 || value > max) {
			throw ErrorFactory.invalidDuration(min, max);
		}
	},

	/**
	 * Validate section is provided
	 */
	section: section => {
		let trimmedSection = null;

		if (section !== undefined && section !== null) {
			if (typeof section === "string") {
				const cleaned = section.trim();
				trimmedSection = cleaned.length > 0 ? cleaned : null;
			}
		}

		if (!trimmedSection) {
			throw ErrorFactory.sectionRequired();
		}

		return trimmedSection;
	},

	/**
	 * Validate resource exists
	 */
	exists: (resource, resourceType = "Resource") => {
		if (!resource) {
			throw ErrorFactory.notFound(resourceType);
		}
		return resource;
	},

	/**
	 * Validate student is whitelisted
	 */
	whitelisted: student => {
		if (!student) {
			throw ErrorFactory.notWhitelisted();
		}
		return student;
	},

	/**
	 * Validate session is valid
	 */
	validSession: (session, isValid) => {
		if (!session) {
			throw ErrorFactory.invalidSession();
		}

		if (!isValid) {
			throw ErrorFactory.expiredSession();
		}

		return session;
	},

	/**
	 * Validate not already attempted
	 */
	notAttempted: (hasAttempted, resourceType = "question") => {
		if (hasAttempted) {
			throw ErrorFactory.alreadyAttempted(resourceType);
		}
	},
};
