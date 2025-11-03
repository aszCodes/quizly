// express/db/seedWhitelist.js
import { addMultipleStudentsToWhitelist } from "../repositories/whitelist.repository.js";

console.log("Seeding student whitelist...");

try {
	// Define your actual student list here
	const students = [
		// IT - A Section
		{ name: "Juan Dela Cruz", section: "IT - A" },
		{ name: "Maria Santos", section: "IT - A" },
		{ name: "Jose Rizal", section: "IT - A" },
		{ name: "Ana Reyes", section: "IT - A" },
		{ name: "Pedro Garcia", section: "IT - A" },
		{ name: "Sofia Rodriguez", section: "IT - A" },
		{ name: "Miguel Torres", section: "IT - A" },
		{ name: "Isabella Cruz", section: "IT - A" },
		{ name: "Diego Ramos", section: "IT - A" },
		{ name: "Camila Flores", section: "IT - A" },

		// IT - B Section
		{ name: "Carlos Mendoza", section: "IT - B" },
		{ name: "Lucia Fernandez", section: "IT - B" },
		{ name: "Gabriel Silva", section: "IT - B" },
		{ name: "Valentina Lopez", section: "IT - B" },
		{ name: "Rafael Morales", section: "IT - B" },
		{ name: "Elena Jimenez", section: "IT - B" },
		{ name: "Fernando Castro", section: "IT - B" },
		{ name: "Carmen Diaz", section: "IT - B" },
		{ name: "Antonio Ruiz", section: "IT - B" },
		{ name: "Rosa Martinez", section: "IT - B" },
	];

	addMultipleStudentsToWhitelist(students);

	console.log(
		`✅ Successfully added ${students.length} students to whitelist`
	);
	console.log("\nStudents by section:");
	console.log(
		"IT - A:",
		students.filter(s => s.section === "IT - A").length,
		"students"
	);
	console.log(
		"IT - B:",
		students.filter(s => s.section === "IT - B").length,
		"students"
	);
} catch (error) {
	console.error("❌ Error seeding whitelist:", error);
	process.exit(1);
}

process.exit(0);
