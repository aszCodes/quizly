export default function errorHandler(err, req, res, next) {
	// Only log errors outside of test environment
	if (process.env.NODE_ENV !== "test") {
		console.error("Error:", err);
	}

	// Database errors
	if (err.code === "SQLITE_ERROR" || err.name === "SqliteError") {
		return res.status(500).json({
			error: "Database error",
			message:
				process.env.NODE_ENV === "development"
					? err.message
					: undefined,
		});
	}

	// Default error
	res.status(err.status || 500).json({
		error: err.message || "Internal server error",
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
}
