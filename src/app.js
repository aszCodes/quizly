import express from "express";
import httpLogger from "./config/logger.js";
import { appConfig } from "./config/app.config.js";
import notFound from "./middlewares/notFound.handler.js";
import errorHandler from "./middlewares/error.handler.js";
import viewRoutes from "./routes/view.routes.js";
import apiRoutes from "./routes/api/index.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config.js";

/**
 * Create and configure Express application
 * @returns {express.Application}
 */
export function createApp() {
	const app = express();

	// View Engine Setup
	app.set("view engine", appConfig.viewEngine.engine);
	app.set("views", appConfig.paths.views);

	// Static Files
	app.use(express.static(appConfig.paths.public));

	// Body Parser Middleware
	app.use(express.json(appConfig.middleware.json));

	// HTTP Request Logger
	app.use(httpLogger);

	// Swagger API
	app.use(
		"/api-docs",
		swaggerUi.serve,
		swaggerUi.setup(swaggerSpec, {
			customCss: ".swagger-ui .topbar { display: none }",
			customSiteTitle: "Quizly API Docs",
		})
	);

	// Mount Routes
	app.use("/", viewRoutes);
	app.use("/api", apiRoutes);

	// Error Handlers
	app.use(notFound);
	app.use(errorHandler);

	return app;
}

export default createApp();
