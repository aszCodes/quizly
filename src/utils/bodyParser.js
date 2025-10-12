// src/utils/bodyParser.js
const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

export const parseBody = (req) => {
	return new Promise((resolve, reject) => {
		let body = "";
		let size = 0;

		req.on("data", (chunk) => {
			size += chunk.length;

			if (size > MAX_BODY_SIZE) {
				req.connection.destroy();
				reject(new Error("Request body too large"));
				return;
			}

			body += chunk.toString();
		});

		req.on("end", () => {
			try {
				const data = JSON.parse(body);
				resolve(data);
			} catch (error) {
				reject(new Error("Invalid JSON"));
			}
		});

		req.on("error", (error) => {
			reject(error);
		});
	});
};

// Sanitize text input to prevent XSS
export const sanitizeText = (text) => {
	if (typeof text !== "string") return "";

	return text
		.trim()
		.replace(/[<>]/g, "") // Remove angle brackets
		.substring(0, 1000); // Max length
};

// Sanitize student name
export const sanitizeName = (name) => {
	if (typeof name !== "string") return "";

	return name
		.trim()
		.replace(/[<>\"']/g, "")
		.substring(0, 100);
};

// Validate array of strings (for options)
export const validateStringArray = (arr, minLength = 2, maxLength = 10) => {
	if (!Array.isArray(arr)) return false;
	if (arr.length < minLength || arr.length > maxLength) return false;

	return arr.every(
		(item) =>
			typeof item === "string" && item.trim().length > 0 && item.length <= 500
	);
};
