import pino from "pino";
import pinoHttp from "pino-http";
import { ENVIRONMENTS } from "./constants.js";

const isProd = process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION;

const logger = pino({
	level: isProd ? "info" : "debug",
	transport: !isProd
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
					singleLine: true,
				},
		  }
		: undefined,
});

const httpLogger = pinoHttp({
	logger,

	serializers: {
		req(req) {
			return {
				method: req.method,
				url: req.url,
				remoteAddress: req.socket?.remoteAddress,
			};
		},
		res(res) {
			return { statusCode: res.statusCode };
		},
	},

	customSuccessMessage(req, res, responseTime) {
		const ip = req.socket?.remoteAddress || "-";
		return `${req.method} ${req.url} -> ${res.statusCode} [${ip}] (${responseTime} ms)`;
	},

	customErrorMessage(req, res, err, responseTime) {
		const ip = req.socket?.remoteAddress || "-";
		return `${req.method} ${req.url} -> ${res.statusCode} [${ip}] (${responseTime} ms) ERROR: ${err.message}`;
	},
});

export default httpLogger;
