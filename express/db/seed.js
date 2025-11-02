import db from "./database.js";

console.log("Seeding database...");

try {
	// Optional cleanup (uncomment if needed)
	// db.exec("DELETE FROM attempts");
	// db.exec("DELETE FROM questions");
	// db.exec("DELETE FROM quizzes");
	// db.exec("DELETE FROM students");

	// ============================================
	// 📘 Insert Quiz: Java Basics (Week 3–4)
	// ============================================
	const javaQuiz = db
		.prepare(
			`
			INSERT INTO quizzes (title, is_active)
			VALUES (?, ?)
		`
		)
		.run("Java Basics (Week 3–4)", 1);

	const quizId = javaQuiz.lastInsertRowid;

	// ============================================
	// 🧩 Insert 20 Questions
	// ============================================
	const insertQuestion = db.prepare(`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`);

	const questions = [
		// Variables & Data Types
		[
			"Which of the following correctly declares a variable in Java?",
			'String name = "Juan";',
			[
				"name = Juan;",
				'String name = "Juan";',
				'var name = "Juan";',
				"String name: Juan;",
			],
		],
		[
			"What data type is used for decimal numbers?",
			"double",
			["int", "double", "char", "boolean"],
		],
		[
			"Which of the following is NOT a primitive data type in Java?",
			"String",
			["int", "char", "boolean", "String"],
		],
		[
			"Which keyword is used to define a constant variable?",
			"final",
			["static", "final", "const", "constant"],
		],
		[
			"Which data type stores a single character, such as 'A'?",
			"char",
			["String", "char", "boolean", "int"],
		],
		[
			"What value does an uninitialized int variable have by default in Java?",
			"0",
			["null", "0", "undefined", "error"],
		],
		[
			"What is the correct way to declare a boolean variable?",
			"boolean isJavaFun = true;",
			[
				"bool isJavaFun = true;",
				"boolean isJavaFun = true;",
				"boolean isJavaFun == true;",
				"Boolean isJavaFun = true;",
			],
		],
		[
			"What is the size (in bits) of an int in Java?",
			"32",
			["8", "16", "32", "64"],
		],

		// Arithmetic Operators
		[
			"What operator gives the remainder of a division?",
			"%",
			["/", "*", "%", "//"],
		],
		["What is the result of 10 % 3?", "1", ["0", "1", "2", "3"]],
		[
			"Which operator increases a variable by 1?",
			"++",
			["--", "++", "+=", "+1"],
		],
		[
			"Which operator decreases a variable by 1?",
			"--",
			["++", "--", "-=", "-1"],
		],
		[
			"What will be the output of: int x = 5 / 2;",
			"2",
			["2", "2.5", "2.0", "Error"],
		],
		[
			"What is the result of: double x = 5.0 / 2;",
			"2.5",
			["2", "2.5", "2.0", "Error"],
		],
		[
			"What does the expression 'x += 5' mean?",
			"Add 5 to x and assign the result to x",
			[
				"Increase x by 5",
				"Add 5 to x and assign the result to x",
				"Assign 5 to x",
				"Compare x to 5",
			],
		],

		// If Statements
		[
			"What will this code print? if (score >= 60) System.out.println('Pass'); else System.out.println('Fail'); when score = 75;",
			"Pass",
			["Fail", "Pass", "Error", "Nothing"],
		],
		[
			"What does this code do? if (age >= 18) System.out.println('Adult');",
			'Prints "Adult" if age is 18 or older',
			[
				"Always prints Adult",
				"Prints Adult if age < 18",
				'Prints "Adult" if age is 18 or older',
				"Throws error",
			],
		],
		[
			"What is the correct syntax for an if statement in Java?",
			'if (x > 5) { System.out.println("Big"); }',
			[
				'if x > 5 then System.out.println("Big");',
				'if (x > 5) System.out.println("Big");',
				'if x > 5 { System.out.println("Big"); }',
				'if (x > 5) { System.out.println("Big"); }',
			],
		],
		[
			"What happens if the condition in an if statement is false and there is no else block?",
			"Nothing happens",
			[
				"The program crashes",
				"Nothing happens",
				"An error occurs",
				"The program skips to next if",
			],
		],
		[
			"Which of the following statements correctly checks if a number is NOT equal to 10?",
			"if (num != 10)",
			[
				"if (num == 10)",
				"if (num =! 10)",
				"if (num <> 10)",
				"if (num != 10)",
			],
		],
	];

	for (const [text, answer, opts] of questions) {
		insertQuestion.run(text, answer, JSON.stringify(opts), quizId);
	}

	console.log("Database Seeded");
} catch (error) {
	console.error("❌ Error seeding database:", error);
	process.exit(1);
}

process.exit(0);
