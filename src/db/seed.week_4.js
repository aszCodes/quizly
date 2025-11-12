import db from "./database.js";

console.log("Seeding database...");

try {
	// ============================================
	// Java Week 4: Operators, Decision Making, and Strings
	// ============================================
	const javaWeek4Quiz = db
		.prepare(
			`
		INSERT INTO quizzes (title, is_active)
		VALUES (?, ?)
	`
		)
		.run("Java (Week 4)", 1);

	const quizId = javaWeek4Quiz.lastInsertRowid;

	const insertQuestion = db.prepare(`
	INSERT INTO questions (question_text, correct_answer, options, quiz_id)
	VALUES (?, ?, ?, ?)
`);

	const questions = [
		// Arithmetic Operators
		[
			"What is the result of `5 / 2` when both operands are integers?",
			"`2`",
			["`2.5`", "`2`", "`3`", "`2.0`"],
		],
		[
			"What is the result of `5.0 / 2` in Java?",
			"`2.5`",
			["`2`", "`2.0`", "`2.5`", "`3`"],
		],
		[
			"What is the output of `5 % 2`?",
			"`1`",
			["`2`", "`0`", "`1`", "`2.5`"],
		],
		[
			"What is the shortcut equivalent of `score = score + 10;`?",
			"`score += 10;`",
			[
				"`score + 10;`",
				"`score ++;`",
				"`score =+ 10;`",
				"`score += 10;`",
			],
		],
		[
			"What does the modulus operator (%) return?",
			"`The remainder after division`",
			[
				"`The quotient after division`",
				"`The percentage after division`",
				"`The remainder after division`",
				"`There is no such operator`",
			],
		],
		[
			"Given `int counter = 0; counter++;` what is the value of counter after execution?",
			"`1`",
			["`0`", "`1`", "`2`", "`-1`"],
		],
		[
			"What is the difference between `x++` and `++x`?",
			"`x++ uses the value first, then increments; ++x increments first, then uses the value`",
			[
				"`x++ also known as prefix, it increments then uses the value while ++x does the opposite `",
				"`x++ increments twice`",
				"`x++ uses the value first, then increments; ++x increments first, then uses the value`",
				"`++x decrements`",
			],
		],
		[
			"What is the output of the following?\n\n`int a = 10, b = 3;\nSystem.out.println(a / b);\n`",
			"`3`",
			["`3.33`", "`3`", "`3.0`", "`4`"],
		],
		[
			"Which operator increases a variable’s value by 1?",
			"`++`",
			["`+=`", "`++`", "`--`", "`+`"],
		],
		[
			"What is the result of the following code?\n`\nint x = 100;\nx /= 2 + 3;\nSystem.out.println(x);\n`",
			"`20`",
			["`10`", "`20`", "`50`", "`25`"],
		],

		// If Statements and Decision Making
		[
			'What is the output of this code?\n\n`\nint age = 20;\nif (age >= 18) {\nSystem.out.println("Adult");\n}\n`',
			"`Adult`",
			["`Nothing`", "`Error`", "`Adult`", "`20`"],
		],
		[
			"What structure is used to execute one block of code if true and another if false?",
			"`if-else`",
			["`if`", "`for`", "`if-else`", "`switch`"],
		],
		[
			"In an if-else if ladder, when does Java stop checking conditions?",
			"`When it finds the first true condition`",
			[
				"`When all are checked`",
				"`When it finds the first true condition`",
				"`After every condition`",
				"`Never stops`",
			],
		],
		[
			'What will this code output?\n\n`\nint score = 85;\nif (score >= 90) {\nSystem.out.println("A");\n} else if (score >= 80) {\nSystem.out.println("B");\n}\n`',
			"`B`",
			["`A`", "`B`", "`C`", "`No output`"],
		],
		[
			"Which statement is CORRECT about nested if statements?",
			"`An if statement can contain another if statement inside it`",
			[
				"`They are not allowed in Java`",
				"`An if statement in the same level (sibling) with another if statement`",
				"`An if statement can contain another if statement inside it`",
				"`They always run both blocks`",
			],
		],
		[
			"What is a common mistake when checking equality in if statements?",
			"`Using = instead of ==`",
			[
				"`Using == instead of =`",
				"`Using > instead of >=`",
				"`Using = instead of ==`",
				"`Using ; after if`",
			],
		],
		[
			"What does `x` equal after this code executes?\n`\nint x = 50;\nx /= x / 10;\nSystem.out.println(x);\n`",
			"`10`",
			["`5`", "`10`", "`25`", "`50`"],
		],
		[
			'In this code, which part executes only if score is less than 60?\n\n`\nif (score >= 60) {\nSystem.out.println("PASSED");\n} else {\nSystem.out.println("FAILED");\n}\n`',
			'`System.out.println("FAILED");`',
			[
				'`System.out.println("PASSED");`',
				'`System.out.println("FAILED");`',
				"`Both`",
				"`None`",
			],
		],
		[
			"Which of the following is used for multi-condition branching?",
			"`if-else if-else`",
			["`for loop`", "`while`", "`if-else if-else`", "`break`"],
		],
		[
			'What is printed by this code?\n`\nint x = 5;\nif (x++ > 5){\nSystem.out.println(x);}\nelse{\n    System.out.println("hello");}\n`',
			"`hello`",
			[
				"`5`",
				"`6`",
				"`hello`",
				"`gagawin ko ang lahat para protektahan ang aking bansa, iingatan ko kayo hanggang dulo basta iingatan niyo din ako`",
			],
		],

		// String Methods and Manipulation
		[
			"What does the method `length()` return?",
			"`The number of characters in a string`",
			[
				"`The last character`",
				"`The number of words`",
				"`The number of characters in a string`",
				"`The index of the first character`",
			],
		],
		[
			'What is the output of `"Hello".charAt(1)`?',
			"`'e'`",
			["`'H'`", "`'e'`", "`'l'`", "`'o'`"],
		],
		[
			"What method converts all characters to uppercase?",
			"`toUpperCase()`",
			[
				"`upperCase()`",
				"`toUpperCase()`",
				"`capitalize()`",
				"`makeUpper()`",
			],
		],
		[
			'What is the result of `"  hi  ".trim()`?',
			'`"hi"`',
			['`"  hi  "`', '`"hi "`', '`" hi"`', '`"hi"`'],
		],
		[
			"Which method compares two strings for equality (case-sensitive)?",
			"`.equals()`",
			["`==`", "`.equals()`", "`.compareTo()`", "`.isEqual()`"],
		],
		[
			"Which is the correct way to concatenate two strings `firstName` and `lastName` with a space?",
			'`firstName + " " + lastName`',
			[
				"`firstName + lastName`",
				"`firstName.concat(lastName)`",
				'`firstName + " " + lastName`',
				"`join(firstName, lastName)`",
			],
		],
		[
			'What does `"Science".contains("Sci")` return?',
			"`true`",
			["`false`", "`true`", "`Sci`", "`Error`"],
		],
		[
			'What will be the output of `"HelloWorld".startsWith("Hello")`?',
			"`true`",
			["`false`", "`true`", "`Hello`", "`Error`"],
		],
		[
			"Why should you avoid using `==` to compare strings?",
			"`Because it compares memory locations, not content`",
			[
				"`Because it is slower`",
				"`Because it compares memory locations, not content`",
				"`Because it only works with numbers`",
				"`Because it changes the string`",
			],
		],
		[
			'What is the output of `"HELLO".toLowerCase()`?',
			"`hello`",
			["`HELLO`", "`Hello`", "`hello`", "`hElLo`"],
		],
	];

	for (const [text, answer, opts] of questions) {
		insertQuestion.run(text, answer, JSON.stringify(opts), quizId);
	}

	console.log(`Java Week 4 quiz seeded with ${questions.length} questions`);
} catch (error) {
	console.error("❌ Error seeding database:", error);
	process.exit(1);
}

process.exit(0);
