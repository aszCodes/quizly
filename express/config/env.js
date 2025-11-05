import { ENVIRONMENTS } from "./constants.js";

/**
 * Validates and provides environment configuration
 */

/**
 * Validates required environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv() {
	const errors = [];

	// Check NODE_ENV is set AND valid
	if (!process.env.NODE_ENV) {
		errors.push("NODE_ENV is required");
	} else {
		const validEnvs = Object.values(ENVIRONMENTS);
		if (!validEnvs.includes(process.env.NODE_ENV)) {
			errors.push(
				`Invalid NODE_ENV: "${
					process.env.NODE_ENV
				}". Must be one of: ${validEnvs.join(", ")}`
			);
		}
	}

	// Check PORT is set AND valid
	if (!process.env.PORT) {
		errors.push("PORT is required");
	} else {
		const port = parseInt(process.env.PORT, 10);
		if (isNaN(port) || port < 1 || port > 65535) {
			errors.push(
				`Invalid PORT: "${process.env.PORT}". Must be a number between 1 and 65535`
			);
		}
	}

	// Check HOST is set
	if (!process.env.HOST) {
		errors.push("HOST is required");
	}

	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
	}
}
