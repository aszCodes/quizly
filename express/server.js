import { validateEnv } from "./config/env.js";
import { appConfig } from "./config/app.config.js";
import app from "./app.js";

/**
 * Validate environment variables on startup
 */
try {
	validateEnv();
	console.log("✓ Environment variables validated");
} catch (error) {
	console.error("✗ Environment validation failed:", error.message);
	process.exit(1);
}

const { port, host } = appConfig.server;

if (import.meta.main) {
	app.listen(port, host, () => {
		console.log(`Running on http://${host}:${port}`);
	});
}

export default app;
