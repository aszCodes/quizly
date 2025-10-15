// src/routes/router.js
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import attemptsHandler from "../handlers/attemptsHandler.js";
import quizHandler from "../handlers/quizHandler.js";
import questionsHandler from "../handlers/questionsHandler.js";
import submitHandler from "../handlers/submitHandler.js";
import {
  getAllQuizzesAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  setActiveQuiz,
  getAllQuestionsAdmin,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
} from "../handlers/adminHandlers.js";
import sendJSON from "../utils/sendJSON.js";
import { requireBasicAuth } from "../middleware/basicAuth.js";
import { extractId, isAdminRoute } from "../utils/routeUtils.js";

export const router = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const { url, method } = req;

  if (isAdminRoute(url)) {
    if (!requireBasicAuth(req, res)) {
      return; // Auth failed
    }
  }

  // Public API Routes
  if (url === "/api/quiz" && method === "GET") {
    quizHandler(req, res);
  } else if (url === "/api/questions" && method === "GET") {
    questionsHandler(req, res);
  } else if (url === "/api/submit" && method === "POST") {
    submitHandler(req, res);
  } else if (url === "/api/attempts" && method === "GET") {
    attemptsHandler(req, res);
  }
  // Admin Quiz Routes (Protected by Basic Auth)
  else if (url === "/api/admin/quizzes" && method === "GET") {
    getAllQuizzesAdmin(req, res);
  } else if (url === "/api/admin/quizzes" && method === "POST") {
    createQuiz(req, res);
  } else if (url.match(/^\/api\/admin\/quizzes\/\d+$/) && method === "PUT") {
    const quizId = extractId(url, /^\/api\/admin\/quizzes\/(\d+)$/);
    if (!quizId) {
      sendJSON(res, 400, { error: "Invalid quiz ID" });
      return;
    }
    updateQuiz(req, res, quizId);
  } else if (url.match(/^\/api\/admin\/quizzes\/\d+$/) && method === "DELETE") {
    const quizId = extractId(url, /^\/api\/admin\/quizzes\/(\d+)$/);
    if (!quizId) {
      sendJSON(res, 400, { error: "Invalid quiz ID" });
      return;
    }
    deleteQuiz(req, res, quizId);
  } else if (
    url.match(/^\/api\/admin\/quizzes\/\d+\/activate$/) &&
    method === "PUT"
  ) {
    const quizId = extractId(url, /^\/api\/admin\/quizzes\/(\d+)\/activate$/);
    if (!quizId) {
      sendJSON(res, 400, { error: "Invalid quiz ID" });
      return;
    }
    setActiveQuiz(req, res, quizId);
  }
  // Admin Questions Routes (Protected by Basic Auth)
  else if (url === "/api/admin/questions" && method === "GET") {
    getAllQuestionsAdmin(req, res);
  } else if (url === "/api/admin/questions" && method === "POST") {
    createQuestion(req, res);
  } else if (url.match(/^\/api\/admin\/questions\/\d+$/) && method === "PUT") {
    const questionId = extractId(url, /^\/api\/admin\/questions\/(\d+)$/);
    if (!questionId) {
      sendJSON(res, 400, { error: "Invalid question ID" });
      return;
    }
    updateQuestion(req, res, questionId);
  } else if (
    url.match(/^\/api\/admin\/questions\/\d+$/) &&
    method === "DELETE"
  ) {
    const questionId = extractId(url, /^\/api\/admin\/questions\/(\d+)$/);
    if (!questionId) {
      sendJSON(res, 400, { error: "Invalid question ID" });
      return;
    }
    deleteQuestion(req, res, questionId);
  } else if (url === "/api/admin/questions/import" && method === "POST") {
    importQuestions(req, res);
  }
  // Static file serving
  else if (url === "/" || url === "/index.html") {
    try {
      const html = await readFile(
        join(process.cwd(), "public", "index.html"),
        "utf-8"
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    } catch (error) {
      sendJSON(res, 500, { error: "Could not load page" });
    }
  } else if (url === "/admin" || url === "/admin.html") {
    // Already authenticated by basicAuth above
    try {
      const html = await readFile(
        join(process.cwd(), "public", "admin.html"),
        "utf-8"
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    } catch (error) {
      sendJSON(res, 500, { error: "Could not load admin page" });
    }
  } else if (url.startsWith("/css/")) {
    const safePath = url.replace(/\.\./g, "").replace(/\/\//g, "/");
    try {
      const css = await readFile(
        join(process.cwd(), "public", safePath),
        "utf-8"
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/css");
      res.end(css);
    } catch (error) {
      sendJSON(res, 404, { error: "CSS not found" });
    }
  } else if (url.startsWith("/js/")) {
    const safePath = url.replace(/\.\./g, "").replace(/\/\//g, "/");
    try {
      const js = await readFile(
        join(process.cwd(), "public", safePath),
        "utf-8"
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      res.end(js);
    } catch (error) {
      sendJSON(res, 404, { error: "JS not found" });
    }
  } else if (url === "/icon.png") {
    try {
      const icon = await readFile(join(process.cwd(), "public", "icon.png"));
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/png");
      res.end(icon);
    } catch (error) {
      sendJSON(res, 404, { error: "Icon not found" });
    }
  } else {
    sendJSON(res, 404, { error: "Not found" });
  }
};
