// src/middleware/basicAuth.js

const ADMIN_USERNAME = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "password123";

/**
 * Simple HTTP Basic Authentication
 * Browser will show login popup automatically
 */
export const requireBasicAuth = (req, res) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Basic ")) {
		// No auth provided - request it
		res.statusCode = 401;
		res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ error: "Authentication required" }));
		return false;
	}

	// Decode base64 credentials
	const base64Credentials = authHeader.split(" ")[1];
	const credentials = Buffer.from(base64Credentials, "base64").toString(
		"utf-8"
	);
	const [username, password] = credentials.split(":");

	// Validate credentials
	if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
		return true; // Authenticated!
	}

	// Invalid credentials
	res.statusCode = 401;
	res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ error: "Invalid credentials" }));
	return false;
};
