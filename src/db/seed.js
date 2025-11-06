import db from "./database.js";

console.log("Seeding database...");

try {
	// Optional cleanup (uncomment if needed)
	// db.exec("DELETE FROM attempts");
	// db.exec("DELETE FROM questions");
	// db.exec("DELETE FROM quizzes");
	// db.exec("DELETE FROM students");

	// ============================================
	// Java Basics (Week 3–4)
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

	const insertQuestion = db.prepare(`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`);

	const questions = [
		//Week 1 and 2

		[
			"Which command is used to compile a Java source file?",
			"`javac HelloWorld.java`",
			[
				"`java HelloWorld.java`",
				"`javac HelloWorld.java`",
				"`run HelloWorld`",
				"`execute HelloWorld`",
			],
		],
		[
			"In Java, what must the file name match?",
			"The public class name",
			[
				"The method name",
				"The variable name",
				"The public class name",
				"The package name",
			],
		],

		// Variables and Data Types

		[
			"Which statement assigns a new value to an existing variable `price`?",
			"`price = 99.99;`",
			[
				"`price = 99.99;`",
				"`double price;`",
				"`double = price;`",
				"`price == 99.99;`",
			],
		],
		[
			"Which of the following is an invalid variable name?",
			"`class`",
			["`studentName`", "`_score`", "`class`", "`total1`"],
		],
		[
			"What is the correct way to declare a variable that can store whole numbers?",
			"`int number;`",
			[
				"`int number;`",
				"`String number;`",
				"`double number;`",
				"`char number;`",
			],
		],
		[
			"Which of the following variable names follows Java's naming rules?",
			"`student_name`",
			["`1student`", "`student-name`", "`student_name`", "`public`"],
		],
		[
			"Which of the following best describes a variable?",
			"A labeled box that stores information, where the label is the variable name and the content inside is the value",
			[
				"A mathematical equation used to calculate values automatically",
				"A labeled box that stores information, where the label is the variable name and the content inside is the value",
				"A function that performs a specific task in a program",
				"A command used to display information on the screen",
			],
		],
		[
			'What does the following line of code do?: `String name = "Juan";`',
			'Declares a variable named name that stores the text "Juan"',
			[
				'Declares a variable named String and assigns it the value "Juan"',
				'Declares a variable named name that stores the text "Juan"',
				'Creates a number variable called name with the value "Juan"',
				'Prints the word "Juan" on the screen',
			],
		],
		[
			"What is the main difference between Java's static typing and Python's dynamic typing?",
			"Java checks data types before running, while Python figures out types while running",
			[
				"Java is faster than Python in all situations",
				"Java checks data types before running, while Python figures out types while running",
				"Python requires explicit type declarations, Java does not",
				"Java can change variable types during runtime, Python cannot",
			],
		],
		[
			"Which data type would be most appropriate for storing a person's age?",
			"`int`",
			["`String`", "`double`", "`int`", "`char`"],
		],
		[
			"What is the difference between `char` and `String` in Java?",
			"`char` uses single quotes for one character, `String` uses double quotes for text",
			[
				"`char` is for numbers, `String` is for text",
				"`char` uses single quotes for one character, `String` uses double quotes for text",
				"They are the same, just different names",
				"`char` is faster but can only store lowercase letters",
			],
		],
		[
			"Which of the following variable names is INVALID in Java?",
			"`2ndPlace`",
			["`_score`", "`$amount`", "`2ndPlace`", "`studentAge`"],
		],
		[
			"What happens in this code?: `int x = 10; double y = x;`",
			"Java automatically converts the int to double (implicit conversion)",
			[
				"An error occurs because you cannot assign int to double",
				"Java automatically converts the int to double (implicit conversion)",
				"The value of x becomes a decimal number",
				"Both x and y become integers",
			],
		],
		[
			"What will be the output of: `double pi = 3.14; int whole = (int) pi; System.out.println(whole);`",
			"`3`",
			["`3.14`", "`3`", "`4`", "An error occurs"],
		],

		// Scanner and User Input

		[
			"What will happen if you forget to close the Scanner object?",
			"Java may keep using system resources unnecessarily",
			[
				"The program won’t compile",
				"Java may keep using system resources unnecessarily",
				"The Scanner will automatically close itself",
				"The input will stop working immediately",
			],
		],
		[
			"In the statement `Scanner input = new Scanner(System.in);`, what does `Scanner` represent?",
			"The data type (class) of the variable `input`",
			[
				"The name of the variable",
				"The data type (class) of the variable `input`",
				"The user input source",
				"The imported package",
			],
		],
		[
			"What keyword is used to create an object from a class in Java?",
			"`new`",
			["`make`", "`create`", "`object`", "`new`"],
		],
		[
			"What is the correct order of steps when using Scanner?",
			"Import, Create, Read, Close",
			[
				"Create, Import, Read, Close",
				"Import, Create, Read, Close",
				"Import, Read, Create, Close",
				"Create, Read, Close, Import",
			],
		],
		[
			"Which import statement is needed to use the Scanner class?",
			"`import java.util.Scanner;`",
			[
				"`import java.scanner.util;`",
				"`import java.util.Scanner;`",
				"`include Scanner;`",
				"`using System.Scanner;`",
			],
		],
		[
			"What does `new Scanner(System.in)` do?",
			"Creates a Scanner object that reads input from the keyboard",
			[
				"Creates a new file to store user input",
				"Creates a Scanner object that reads input from the keyboard",
				"Displays a message asking for input",
				"Imports the Scanner class into the program",
			],
		],
		[
			"Which Scanner method should you use to read a full line of text including spaces?",
			"`nextLine()`",
			["`next()`", "`nextLine()`", "`nextString()`", "`readLine()`"],
		],
		[
			"What will `nextInt()` read from this input: `25 years old`?",
			"`25` (only the number)",
			[
				"`25 years old` (the entire line)",
				"`25` (only the number)",
				"`25 years` (number and next word)",
				"Nothing, it will cause an error",
			],
		],
		[
			"Why do we need to call `input.close()` after using Scanner?",
			"To free system resources that Java reserved for input",
			[
				"To delete all the input data",
				"To free system resources that Java reserved for input",
				"To prevent users from entering more input",
				"To display a goodbye message",
			],
		],
		[
			"What problem occurs in this code?: `int age = sc.nextInt(); String name = sc.nextLine();`",
			"The `nextLine()` will be skipped because `nextInt()` leaves a newline character",
			[
				"The Scanner will read the age as text instead of a number",
				"The `nextLine()` will be skipped because `nextInt()` leaves a newline character",
				"The program will crash because you cannot mix different input methods",
				"Nothing, the code works perfectly",
			],
		],
		[
			"How do you fix the skipped input problem when using `nextInt()` before `nextLine()`?",
			"Add an extra `sc.nextLine();` after `nextInt()` to consume the leftover newline",
			[
				"Use `next()` instead of `nextLine()`",
				"Close and reopen the Scanner",
				"Add an extra `sc.nextLine();` after `nextInt()` to consume the leftover newline",
				"Change `nextInt()` to `nextLine()` and convert to int",
			],
		],

		// Data Types Application

		[
			"Which data type would be best for storing the price of an item in a store?",
			"`double`",
			["`int`", "`double`", "`String`", "`boolean`"],
		],
		[
			"What is the correct way to declare a character variable for the letter 'A'?",
			"`char grade = 'A';`",
			[
				'`char grade = "A";`',
				"`char grade = 'A';`",
				"`String grade = 'A';`",
				"`character grade = 'A';`",
			],
		],
		[
			"Which statement correctly declares a boolean variable?",
			"`boolean isStudent = true;`",
			[
				'`boolean isStudent = "true";`',
				"`boolean isStudent = 1;`",
				"`boolean isStudent = true;`",
				"`bool isStudent = true;`",
			],
		],
		[
			'What is the output of: `System.out.println("Age: " + 18);`',
			"`Age: 18`",
			["`Age: 18`", "`Age: + 18`", '`Age: "18"`', "An error occurs"],
		],
		[
			"Why does String start with a capital S in Java?",
			"Because String is a class, not a primitive type",
			[
				"Because it's a keyword that must be capitalized",
				"To make it easier to read in code",
				"Because String is a class, not a primitive type",
				"It's a Java convention for all data types",
			],
		],
	];

	for (const [text, answer, opts] of questions) {
		insertQuestion.run(text, answer, JSON.stringify(opts), quizId);
	}

	console.log(`Database seeded with ${questions.length} questions`);
} catch (error) {
	console.error("❌ Error seeding database:", error);
	process.exit(1);
}

process.exit(0);
