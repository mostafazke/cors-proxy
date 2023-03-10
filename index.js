const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const mcache = require("memory-cache");

const cache = (duration) => {
	return (req, res, next) => {
		const key = `__express__${req.originalUrl}` || req.url;
		const cachedBody = mcache.get(key);
		if (cachedBody) {
			res.send(cachedBody);
			return;
		} else {
			res.sendResponse = res.send;
			res.send = (body) => {
				mcache.put(key, body, duration * 1000);
				res.sendResponse(body);
			};
			next();
		}
	};
};

const app = express();
app.use(
	cors({
		origin: "*",
	}),
);
const myLimit =
	typeof process.argv[2] !== "undefined" ? process.argv[2] : "100kb";
console.log("Using limit: ", myLimit);
app.use(bodyParser.json({ limit: myLimit }));

app.all("*", cache(12 * 60 * 60), function (req, res, next) {
	// Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
	res.header(
		"Access-Control-Allow-Headers",
		req.header("access-control-request-headers"),
	);
	if (req.method === "OPTIONS") {
		//   // CORS Preflight
		res.send();
	} else {
		const targetURL = req.header("Target-URL") || req.query.url; // Target-URL ie. https://example.com or http://example.com
		if (!targetURL) {
			res
				.status(500)
				.send({ error: "There is no Target-Endpoint header in the request" });
			return;
		}

		axios
			.get(targetURL, { responseType: "document" })
			.then(({ data }) => {
				res.send(data);
			})
			.catch((err) => {
				res.status(500).send({ error: err.message });
			});
	}
});

app.set("port", process.env.PORT || 3000);

app.listen(app.get("port"), function () {
	console.log(`Proxy server listening on port ${app.get("port")}`);
});
