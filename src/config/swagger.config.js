import swaggerJsdoc from "swagger-jsdoc";
import { appConfig } from "./app.config.js";

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Quizly API",
			version: "1.0.0",
			description:
				"A self-hosted quiz application API for classroom assessments",
			contact: {
				name: "API Support",
				email: "support@quizly.com",
			},
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
		},
		servers: [
			{
				url: `http://${appConfig.server.host}:${appConfig.server.port}`,
				description: "Development server",
			},
		],
		tags: [
			{
				name: "Quizzes",
				description: "Quiz management and session endpoints",
			},
			{
				name: "Questions",
				description: "Standalone question endpoints",
			},
			{
				name: "Whitelist",
				description: "Student whitelist management",
			},
		],
		components: {
			schemas: {
				Quiz: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						title: {
							type: "string",
							example: "Java Basics (Week 3–4)",
						},
						is_active: { type: "integer", example: 1 },
						created_at: { type: "string", format: "date-time" },
					},
				},
				Question: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						question_text: {
							type: "string",
							example: "What is 2+2?",
						},
						options: {
							type: "array",
							items: { type: "string" },
							example: ["2", "3", "4", "5"],
						},
					},
				},
				StartQuizRequest: {
					type: "object",
					required: ["studentName", "section"],
					properties: {
						studentName: {
							type: "string",
							example: "Juan Dela Cruz",
						},
						section: { type: "string", example: "IT - A" },
					},
				},
				StartQuizResponse: {
					type: "object",
					properties: {
						sessionToken: { type: "string", example: "abc123..." },
						question: { $ref: "#/components/schemas/Question" },
						totalQuestions: { type: "integer", example: 20 },
						currentIndex: { type: "integer", example: 0 },
					},
				},
				SubmitAnswerRequest: {
					type: "object",
					required: ["sessionToken", "questionId", "answer"],
					properties: {
						sessionToken: { type: "string", example: "abc123..." },
						questionId: { type: "integer", example: 1 },
						answer: { type: "string", example: "4" },
					},
				},
				SubmitAnswerResponse: {
					type: "object",
					properties: {
						correct: { type: "boolean", example: true },
						score: { type: "number", example: 1 },
						completed: { type: "boolean", example: false },
						nextQuestion: { $ref: "#/components/schemas/Question" },
						currentIndex: { type: "integer", example: 1 },
						totalQuestions: { type: "integer", example: 20 },
					},
				},
				LeaderboardEntry: {
					type: "object",
					properties: {
						student_name: {
							type: "string",
							example: "Juan Dela Cruz",
						},
						section: { type: "string", example: "IT - A" },
						score: { type: "number", example: 18 },
						duration: { type: "number", example: 45000 },
						attempts: { type: "integer", example: 20 },
					},
				},
				WhitelistedStudent: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1 },
						name: { type: "string", example: "Juan Dela Cruz" },
						section: { type: "string", example: "IT - A" },
						is_active: { type: "integer", example: 1 },
						created_at: { type: "string", format: "date-time" },
					},
				},
				Error: {
					type: "object",
					properties: {
						error: { type: "string", example: "Validation failed" },
						code: { type: "string", example: "VALIDATION_ERROR" },
					},
				},
			},
		},
	},
	apis: ["./src/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
