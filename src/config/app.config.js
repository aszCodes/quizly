import path from "node:path";

/**
 * Application configuration
 * Centralized app-level settings and paths
 */

const __dirname = path.dirname(import.meta.filename);

export const appConfig = {
	// Server configuration
	server: {
		port: process.env.PORT,
		host: process.env.HOST,
	},

	// Path configuration
	paths: {
		root: path.join(__dirname, ".."),
		views: path.join(__dirname, "..", "views"),
		public: path.join(__dirname, "..", "public"),
	},

	// View engine configuration
	viewEngine: {
		engine: "ejs",
	},

	// Middleware configuration
	middleware: {
		json: {
			limit: "10mb",
		},
	},

	// CORS configuration
	cors: {
		enabled: false,
		options: {
			origin: "*",
			methods: ["GET", "POST", "PUT", "DELETE"],
		},
	},
};
