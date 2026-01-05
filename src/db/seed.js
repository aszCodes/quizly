import db from "./database.js";

console.log("Seeding database...");

try {
	// Optional cleanup (uncomment if needed)
	// db.exec("DELETE FROM attempts");
	// db.exec("DELETE FROM questions");
	// db.exec("DELETE FROM quizzes");
	// db.exec("DELETE FROM students");

	const javaQuiz = db
		.prepare(
			`
			INSERT INTO quizzes (title, is_active)
			VALUES (?, ?)
		`
		)
		.run("CC102 (Week 1, 1.1, 2)", 1);

	const quizId = javaQuiz.lastInsertRowid;

	const insertQuestion = db.prepare(`
		INSERT INTO questions (question_text, correct_answer, options, quiz_id)
		VALUES (?, ?, ?, ?)
	`);

	const questions = [
		//Week 1
		[
			[
				"What is a computer?",
				"An electronic device that accepts input, processes data, stores information, and produces output",
				[
					"A mechanical device used for writing",
					"An electronic device that accepts input, processes data, stores information, and produces output",
					"A machine that only stores information",
					"A device used only for communication",
				],
			],
			[
				"What does a computer accept to begin processing?",
				"Input",
				["Output", "Input", "Storage", "Code"],
			],
			[
				"What does a computer produce after processing data?",
				"Output",
				["Input", "Storage", "Output", "Program"],
			],
			[
				"What is programming?",
				"Writing instructions that tell a computer how to perform a task",
				[
					"Using a computer",
					"Fixing hardware problems",
					"Writing instructions that tell a computer how to perform a task",
					"Designing software interfaces",
				],
			],
			[
				"What do we call the instructions written in programming?",
				"Code",
				["Data", "Algorithm", "Code", "Output"],
			],
			[
				"What is problem solving?",
				"The process of identifying a problem, breaking it down, and finding a step-by-step solution",
				[
					"Typing instructions",
					"Running a program",
					"The process of identifying a problem, breaking it down, and finding a step-by-step solution",
					"Saving information",
				],
			],
			[
				"What is an algorithm?",
				"A step-by-step process",
				[
					"A programming language",
					"A computer program",
					"A step-by-step process",
					"A type of hardware",
				],
			],
			[
				"What does an algorithm require?",
				"A clear set of instructions",
				[
					"A specific programming language",
					"A clear set of instructions",
					"A computer",
					"Internet access",
				],
			],
			[
				"Which part of problem solving describes the actions taken in order?",
				"Process",
				["Input", "Output", "Process", "Storage"],
			],
			[
				"Which part of problem solving shows the final result?",
				"Output",
				["Input", "Process", "Output", "Code"],
			],
		],

		//Week 1.1
		[
			[
				"Which programmer is most concerned with how software interacts directly with the operating system?",
				"System Programmer",
				[
					"Application Developer",
					"System Programmer",
					"Web Developer",
					"Game Developer",
				],
			],
			[
				"A programmer optimizing memory usage and CPU processes is most likely a:",
				"System Programmer",
				[
					"Front-End Developer",
					"System Programmer",
					"Application Developer",
					"Data Programmer",
				],
			],
			[
				"Which programmer focuses on user interaction, layout, and visual behavior of a website?",
				"Front-End Developer",
				[
					"Back-End Developer",
					"System Programmer",
					"Front-End Developer",
					"Data / AI Programmer",
				],
			],
			[
				"Handling databases, authentication, and server logic is primarily the role of a:",
				"Back-End Developer",
				[
					"Front-End Developer",
					"Game Developer",
					"Back-End Developer",
					"Application Developer",
				],
			],
			[
				"A programmer who understands both client-side interfaces and server-side logic is a:",
				"Full-stack Developer",
				[
					"Web Designer",
					"Back-End Developer",
					"Application Developer",
					"Full-stack Developer",
				],
			],
			[
				"Which type of programmer is most likely to work with game engines and physics systems?",
				"Game Developer",
				[
					"Application Developer",
					"System Programmer",
					"Game Developer",
					"Web Developer",
				],
			],
			[
				"Developing intelligent systems that analyze data and automate decisions is the focus of a:",
				"Data / AI Programmer",
				[
					"System Programmer",
					"Application Developer",
					"Data / AI Programmer",
					"Front-End Developer",
				],
			],
			[
				"A desktop application used for managing inventory is typically built by a:",
				"Application Developer",
				[
					"Game Developer",
					"Application Developer",
					"System Programmer",
					"Web Developer",
				],
			],
			[
				"Which programmer is least likely to work directly with HTML and CSS?",
				"System Programmer",
				[
					"Front-End Developer",
					"Web Developer",
					"System Programmer",
					"Full-stack Developer",
				],
			],
			[
				"Creating software that allows hardware devices to communicate with the operating system is the responsibility of a:",
				"System Programmer",
				[
					"Application Developer",
					"Game Developer",
					"System Programmer",
					"Data Programmer",
				],
			],
		],

		//Week 2
		[
			[
				"Which generation of programming language uses binary code (1s and 0s)?",
				"Machine Language",
				[
					"Assembly Language",
					"High-Level Language",
					"Machine Language",
					"Scripting Language",
				],
			],
			[
				"Why is machine language considered difficult to use?",
				"It is extremely difficult to write and read",
				[
					"It runs very slowly",
					"It is extremely difficult to write and read",
					"It cannot perform calculations",
					"It requires internet access",
				],
			],
			[
				"Which generation of language uses symbolic codes or mnemonics?",
				"Assembly Language",
				[
					"Machine Language",
					"Assembly Language",
					"High-Level Language",
					"Object-Oriented Language",
				],
			],
			[
				"What tool is required to convert assembly language into machine code?",
				"Assembler",
				["Compiler", "Interpreter", "Assembler", "Debugger"],
			],
			[
				"Why were high-level languages created?",
				"To make programming closer to human language and easier to write",
				[
					"To replace operating systems",
					"To make programming closer to human language and easier to write",
					"To remove the need for computers",
					"To increase hardware complexity",
				],
			],
			[
				"Which language was the first widely used high-level programming language?",
				"FORTRAN",
				["COBOL", "C", "FORTRAN", "Python"],
			],
			[
				"Which programming language was designed for business data processing?",
				"COBOL",
				["FORTRAN", "COBOL", "C", "Java"],
			],
			[
				"Which language was created to balance efficiency with high-level programming features?",
				"C",
				["COBOL", "C", "Python", "JavaScript"],
			],
			[
				"Which programming language added object-oriented features to C?",
				"C++",
				["C", "C++", "Java", "Python"],
			],
			[
				"Which programming language is known for clean and readable syntax?",
				"Python",
				["C", "COBOL", "Python", "Assembly Language"],
			],
		],
	];

	for (const week of questions) {
		for (const [text, answer, opts] of week) {
			insertQuestion.run(text, answer, JSON.stringify(opts), quizId);
		}
	}
	console.log(`Database seeded with ${questions.length} questions`);
} catch (error) {
	console.error("❌ Error seeding database:", error);
	process.exit(1);
}

process.exit(0);
