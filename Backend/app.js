// app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");
const linksRoutes = require("./routes/links");
const transactionsRoutes = require("./routes/transactions");
const webhooksRoutes = require("./routes/webhooks");

const app = express();

// Middleware
app.use(cors({
	origin: process.env.FRONTEND_URL || "http://localhost:5173",
	credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/webhooks", webhooksRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something broke!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
