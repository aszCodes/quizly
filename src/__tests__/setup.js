import { clearDatabase } from "./testUtils.js";
import db from "../db/database.js";

// Runs before each test
beforeEach(() => {
	clearDatabase();
});

// After all tests, do a full cleanup and close DB
afterAll(() => {
	clearDatabase();
	db.close();
});
