import { createServer } from "node:http";
import { router } from "./src/routes/router.js";

const hostname = process.env.HOST;
const port = process.env.PORT;

const server = createServer(router);

server
	.listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	})
	.on("error", (err) => {
		console.error("Server error:", err);
	});
