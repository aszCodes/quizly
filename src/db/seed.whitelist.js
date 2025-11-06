import { addMultipleStudentsToWhitelist } from "../repositories/whitelist.repository.js";

console.log("Seeding student whitelist...");

try {
	// Define your actual student list here
	const students = [
		// IT - A Section
		{ name: "Abaco, Carmelo Anthony L.", section: "IT - A" },
		{ name: "Albinto, Michelle Faith B.", section: "IT - A" },
		{ name: "Alcantara, Dominic R.", section: "IT - A" },
		{ name: "Bernardo, Clarence S.", section: "IT - A" },
		{ name: "Cabanila, Sharmela E.", section: "IT - A" },
		{ name: "Castro, John Lloyd S.", section: "IT - A" },
		{ name: "Cruz, Jenalyn M.", section: "IT - A" },
		{ name: "Garcia, Adolfo L.", section: "IT - A" },
		{ name: "Gregorio, Jan Jan O.", section: "IT - A" },
		{ name: "Ortiz, Lester John N.", section: "IT - A" },
		{ name: "Ortiz, Krizza Joy C.", section: "IT - A" },
		{ name: "Ortiz, Ronald A.", section: "IT - A" },
		{ name: "Pajarillo, James Russel C.", section: "IT - A" },
		{ name: "Perez, Marky G.", section: "IT - A" },
		{ name: "Porcioncula, Jerzzey Lei C.", section: "IT - A" },
		{ name: "Reyes, Tristan H.", section: "IT - A" },
		{ name: "Salvador, Mhar Angelo V.", section: "IT - A" },
		{ name: "Temblor, Arlene S.", section: "IT - A" },

		// IT - B Section
		{ name: "__Lorenzo, John Miller O.", section: "IT - B" },
		{ name: "Alarcon, Rochelle C.", section: "IT - B" },
		{ name: "Azurin, Jalaine G.", section: "IT - B" },
		{ name: "Barangan, Jaymhar H.", section: "IT - B" },
		{ name: "Calilap, Jamaica N.", section: "IT - B" },
		{ name: "Faustino, John Denver P.", section: "IT - B" },
		{ name: "Flores, John Paul C.", section: "IT - B" },
		{ name: "Gabuyo, Efren S.", section: "IT - B" },
		{ name: "Ganao, Johnrold Hanz A.", section: "IT - B" },
		{ name: "Lacanilao, Ian Nickson P.", section: "IT - B" },
		{ name: "Marcos, Melvin O.", section: "IT - B" },
		{ name: "Martinez, Kyla Dream P.", section: "IT - B" },
		{ name: "Mendoza, Ricardo D.G", section: "IT - B" },
		{ name: "Ramos, Maxxine D.C", section: "IT - B" },
		{ name: "Reyes, Calvin Kleine A.", section: "IT - B" },
		{ name: "Talusan, Rainiel M.", section: "IT - B" },
		{ name: "Vana, John Wilson B.", section: "IT - B" },
		{ name: "Vicente, Mark David A.", section: "IT - B" },
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
