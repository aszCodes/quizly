const sendJSON = (res, statusCode, data) => {
	res.statusCode = statusCode;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(data));
};

export default sendJSON;
