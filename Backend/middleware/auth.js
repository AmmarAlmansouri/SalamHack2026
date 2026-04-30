// middleware/auth.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const token = authHeader.split(" ")[1];

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = {
			userId: decoded.userId,
			email: decoded.email,
		};

		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Token expired" });
		}
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({ error: "Invalid token" });
		}
		return res.status(500).json({ error: "Authentication error" });
	}
};

module.exports = authMiddleware;
