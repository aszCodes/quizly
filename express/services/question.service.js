import * as questionRepo from "../repositories/question.repository.js";
import * as studentRepo from "../repositories/students.repository.js";
import * as whitelistRepo from "../repositories/whitelist.repository.js";
import { ErrorFactory, validateOrThrow } from "../errors/error.factory.js";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;
const MAX_DURATION = 3600000; // 1 hour

/**
 * Get the currently active standalone question.
 *
 * @returns {{id:number, question_text:string, options:string[]}}
 * @throws {NotFoundError} If no active question exists.
 * @throws {DatabaseError} If a repository error occurs.
 */
export const getActiveQuestion = () => {
	// Fetch currently active question
	const question = questionRepo.fetchSingleQuestion();

	// Ensure an active question exists
	validateOrThrow.exists(question, "Active question");

	// Return minimal payload
	const { id, question_text, options } = question;
	return { id, question_text, options };
};

/**
 * Submit an answer for a standalone question.
 *
 * @param {string} studentName - Full name of the student.
 * @param {string} section - Student’s section identifier.
 * @param {number} questionId - Target question ID.
 * @param {string|number} answer - Student’s submitted answer.
 * @param {number} duration - Time spent answering (in milliseconds).
 *
 * @returns {{
 *   correct: boolean,
 *   score: number,
 *   correct_answer: string
 * }}
 *
 * @throws {ValidationError} If inputs are missing or invalid.
 * @throws {ForbiddenError} If the student is not whitelisted.
 * @throws {NotFoundError} If the question does not exist.
 * @throws {ConflictError} If the student already attempted this question.
 * @throws {BadRequestError} If the question is part of a quiz.
 * @throws {DatabaseError} If a repository error occurs.
 */
export const submitSingleAnswer = (
	studentName,
	section,
	questionId,
	answer,
	duration
) => {
	// Validate required fields and types
	validateOrThrow.requiredFields(
		{ studentName, section, questionId, answer, duration },
		["studentName", "section", "questionId", "answer", "duration"]
	);
	validateOrThrow.positiveInteger(questionId, "question ID");

	// Sanitize and normalize user inputs
	const trimmedName = validateOrThrow.stringLength(
		studentName,
		"student name",
		MIN_NAME_LENGTH,
		MAX_NAME_LENGTH
	);
	const trimmedSection = validateOrThrow.section(section);
	const answerStr = typeof answer === "string" ? answer : String(answer);
	const trimmedAnswer = answerStr.trim();
	if (!trimmedAnswer)
		throw ErrorFactory.invalidField("answer", "cannot be empty");
	validateOrThrow.duration(duration, 1, MAX_DURATION);

	// Check if student is whitelisted
	const whitelistedStudent = whitelistRepo.isStudentWhitelisted(
		trimmedName,
		trimmedSection
	);
	validateOrThrow.whitelisted(whitelistedStudent);

	// Retrieve and validate question
	const question = questionRepo.fetchQuestionById(questionId);
	validateOrThrow.exists(question, "Question");
	if (question.quiz_id !== null) throw ErrorFactory.quizPartOfQuestion();

	// Find or create student record
	const student = studentRepo.findOrCreateStudent(
		trimmedName,
		trimmedSection
	);

	// Prevent reattempts
	validateOrThrow.notAttempted(
		questionRepo.hasAttemptedQuestion(student.id, questionId),
		"question"
	);

	// Grade answer
	const isCorrect =
		trimmedAnswer.toLowerCase() ===
		question.correct_answer.trim().toLowerCase();
	const score = isCorrect ? 10 : 0;

	// Persist attempt
	questionRepo.createSingleAttempt(
		student.id,
		questionId,
		trimmedAnswer,
		score,
		duration
	);

	// Return grading result
	return {
		correct: isCorrect,
		score,
		correct_answer: question.correct_answer,
	};
};

/**
 * Get leaderboard for standalone questions.
 *
 * @returns {Array<{id:number, name:string, section:string, total_score:number, average_duration:number}>}
 * @throws {DatabaseError} If a repository error occurs.
 */
export const getSingleLeaderboard = () => {
	// Fetch leaderboard entries from repository
	return questionRepo.fetchSingleQuestionLeaderboard();
};
