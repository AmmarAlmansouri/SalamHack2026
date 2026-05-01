// routes/account.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/database");
const authMiddleware = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// ==================== VALIDATION MIDDLEWARE ====================
const validateEditName = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2, max: 100 })
		.withMessage("Name must be between 2 and 100 characters"),
];

const validateChangePassword = [
	body("currentPassword")
		.notEmpty()
		.withMessage("Current password is required"),
	body("newPassword")
		.notEmpty()
		.withMessage("New password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.matches(/[A-Z]/)
		.withMessage("Password must contain at least one uppercase letter")
		.matches(/[a-z]/)
		.withMessage("Password must contain at least one lowercase letter")
		.matches(/[0-9]/)
		.withMessage("Password must contain at least one number")
		.matches(/[!@#$%^&*]/)
		.withMessage("Password must contain at least one special character"),
];

const validateUpdateEmail = [
	body("newEmail")
		.isEmail()
		.withMessage("Invalid email format")
		.normalizeEmail(),
	body("password")
		.notEmpty()
		.withMessage("Password is required to change email"),
];

const validateAddCryptoAddress = [
	body("currency")
		.trim()
		.notEmpty()
		.withMessage("Currency is required")
		.isIn([
			"BTC",
			"ETH",
			"USDT",
			"USDC",
			"BNB",
			"XRP",
			"SOL",
			"ADA",
			"DOGE",
			"DOT",
			"TRX",
		]),
	body("network")
		.trim()
		.notEmpty()
		.withMessage("Network is required")
		.custom((value, { req }) => {
			const validNetworks = {
				BTC: ["Bitcoin", "SegWit"],
				ETH: ["ERC20", "Ethereum"],
				USDT: ["ERC20", "TRC20", "BEP20", "SOL"],
				USDC: ["ERC20", "TRC20", "BEP20", "SOL"],
				BNB: ["BEP2", "BEP20"],
				XRP: ["Ripple"],
				SOL: ["Solana"],
				ADA: ["Cardano"],
				DOGE: ["Dogecoin"],
				DOT: ["Polkadot"],
				TRX: ["TRC20"],
			};

			const currency = req.body.currency;
			if (!validNetworks[currency]?.includes(value)) {
				throw new Error(`Invalid network ${value} for ${currency}`);
			}
			return true;
		}),
	body("address")
		.trim()
		.notEmpty()
		.withMessage("Address is required")
		.isLength({ min: 26, max: 100 })
		.withMessage("Invalid address length"),
	body("label")
		.optional()
		.trim()
		.isLength({ max: 50 })
		.withMessage("Label cannot exceed 50 characters"),
];

const validateDeleteCryptoAddress = [
	body("addressId").isInt().withMessage("Invalid address ID"),
];

// ==================== GET PROFILE ====================
router.get("/profile", authMiddleware, async (req, res) => {
	try {
		const [users] = await db.query(
			`SELECT id, name, email, is_verified, email_verified_at, 
                    new_email, created_at, updated_at, last_login
             FROM users 
             WHERE id = ?`,
			[req.user.userId],
		);

		if (users.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = users[0];

		const [cryptoAddresses] = await db.query(
			`SELECT id, currency, network, address, label, created_at, updated_at
             FROM crypto_addresses 
             WHERE user_id = ?`,
			[user.id],
		);

		user.crypto_addresses = cryptoAddresses;

		res.json({ user });
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// ==================== EDIT NAME ====================
router.put("/name", authMiddleware, validateEditName, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name } = req.body;
		const userId = req.user.userId;

		const [result] = await db.query(
			`UPDATE users 
             SET name = ?,
                 updated_at = NOW()
             WHERE id = ?`,
			[name.trim(), userId],
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		res.json({
			message: "Name updated successfully",
			data: { name: name.trim() },
		});
	} catch (error) {
		console.error("Edit name error:", error);
		if (error.code === "ER_DUP_ENTRY") {
			return res.status(409).json({ error: "This name is already taken" });
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

// ==================== CHANGE PASSWORD ====================
router.put(
	"/password",
	authMiddleware,
	validateChangePassword,
	async (req, res) => {
		const connection = await db.getConnection();

		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { currentPassword, newPassword } = req.body;
			const userId = req.user.userId;

			await connection.beginTransaction();

			// Get current password hash
			const [users] = await connection.query(
				"SELECT password FROM users WHERE id = ?",
				[userId],
			);

			if (users.length === 0) {
				return res.status(404).json({ error: "User not found" });
			}

			const user = users[0];

			// Verify current password
			const isPasswordValid = await bcrypt.compare(
				currentPassword,
				user.password,
			);
			if (!isPasswordValid) {
				return res.status(401).json({ error: "Current password is incorrect" });
			}

			// Check if new password is same as current
			const isSamePassword = await bcrypt.compare(newPassword, user.password);
			if (isSamePassword) {
				return res.status(400).json({
					error: "New password cannot be the same as current password",
				});
			}

			// Hash new password
			const salt = await bcrypt.genSalt(12);
			const hashedPassword = await bcrypt.hash(newPassword, salt);

			// Update password
			await connection.query(
				`UPDATE users 
             SET password = ?,
                 password_changed_at = NOW(),
                 updated_at = NOW()
             WHERE id = ?`,
				[hashedPassword, userId],
			);

			// Invalidate all other sessions except current
			await connection.query(
				`UPDATE user_sessions 
             SET is_active = false,
                 invalidated_at = NOW()
             WHERE user_id = ? 
             AND id != ?
             AND is_active = true`,
				[userId, req.sessionId], // Assuming you store session ID in request
			);

			await connection.commit();

			// Send email notification
			const [userData] = await connection.query(
				"SELECT email, name FROM users WHERE id = ?",
				[userId],
			);

			if (userData.length > 0) {
				const { email, name } = userData[0];
				const nodemailer = require("nodemailer");
				const transporter = nodemailer.createTransport({
					host: process.env.SMTP_HOST,
					port: process.env.SMTP_PORT,
					secure: process.env.SMTP_SECURE === "true",
					auth: {
						user: process.env.SMTP_USER,
						pass: process.env.SMTP_PASS,
					},
				});

				await transporter.sendMail({
					from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
					to: email,
					subject: "Password Changed Successfully",
					html: `
                    <h1>Password Changed</h1>
                    <p>Hello ${name},</p>
                    <p>Your password was successfully changed.</p>
                    <p>If you didn't make this change, please contact support immediately.</p>
                    <p>Time: ${new Date().toISOString()}</p>
                `,
				});
			}

			res.json({
				message:
					"Password updated successfully. You will be logged out of other devices.",
			});
		} catch (error) {
			await connection.rollback();
			console.error("Change password error:", error);
			res.status(500).json({ error: "Internal server error" });
		} finally {
			connection.release();
		}
	},
);

// ==================== UPDATE EMAIL ====================
router.put("/email", authMiddleware, validateUpdateEmail, async (req, res) => {
	const connection = await db.getConnection();

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { newEmail } = req.body;
		const userId = req.user.userId;

		await connection.beginTransaction();

		// Get current user data
		const [users] = await connection.query(
			"SELECT email FROM users WHERE id = ?",
			[userId],
		);

		if (users.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = users[0];

		// Check if new email is same as current
		if (user.email.toLowerCase() === newEmail.toLowerCase()) {
			return res
				.status(400)
				.json({ error: "New email is same as current email" });
		}

		// Check if email already exists
		const [existingUsers] = await connection.query(
			"SELECT id FROM users WHERE email = ? AND id != ?",
			[newEmail.toLowerCase(), userId],
		);

		if (existingUsers.length > 0) {
			return res.status(409).json({ error: "Email is already in use" });
		}

		// Generate email verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Store old email for revert
		const oldEmail = user.email;

		// Update email with pending status
		await connection.query(
			`UPDATE users 
             SET new_email = ?,
                 email_verification_token = ?,
                 email_verification_token_expiry = ?,
                 updated_at = NOW()
             WHERE id = ?`,
			[
				newEmail.toLowerCase(),
				verificationToken,
				verificationTokenExpiry,
				userId,
			],
		);

		// Send verification email to new address
		const nodemailer = require("nodemailer");
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			secure: process.env.SMTP_SECURE === "true",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		const confirmLink = `${process.env.FRONTEND_URL}/verify-new-email?token=${verificationToken}`;

		await transporter.sendMail({
			from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
			to: newEmail,
			subject: "Verify Your New Email Address",
			html: `
                <h1>Email Change Request</h1>
                <p>You requested to change your email address from ${oldEmail} to ${newEmail}.</p>
                <p>Please verify your new email by clicking the link below:</p>
                <a href="${confirmLink}">Verify New Email</a>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't request this change, your email will remain unchanged.</p>
            `,
		});

		// Send notification to old email
		await transporter.sendMail({
			from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
			to: oldEmail,
			subject: "Email Change Requested",
			html: `
                <h1>Email Change Requested</h1>
                <p>A request was made to change your email from ${oldEmail} to ${newEmail}.</p>
                <p>If this was you, please check your new email for verification.</p>
                <p>If you didn't request this, please contact support immediately.</p>
            `,
		});

		await connection.commit();

		res.json({
			message:
				"Verification email sent to your new email address. Please verify to complete the change.",
			data: {
				oldEmail: oldEmail,
				pendingEmail: newEmail.toLowerCase(),
			},
		});
	} catch (error) {
		await connection.rollback();
		console.error("Update email error:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		connection.release();
	}
});

// ==================== VERIFY NEW EMAIL ====================
router.post("/verify-new-email", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { token } = req.body;

		if (!token) {
			return res.status(400).json({ error: "Verification token is required" });
		}

		await connection.beginTransaction();

		// Find user with valid token
		const [users] = await connection.query(
			`SELECT id, email, new_email 
             FROM users 
             WHERE email_verification_token = ? 
             AND email_verification_token_expiry > NOW()`,
			[token],
		);

		if (users.length === 0) {
			return res
				.status(400)
				.json({ error: "Invalid or expired verification token" });
		}

		const user = users[0];

		// Update email
		await connection.query(
			`UPDATE users 
             SET email = new_email,
                 new_email = NULL,
                 email_verification_token = NULL,
                 email_verification_token_expiry = NULL,
                 email_verified_at = NOW(),
                 updated_at = NOW()
             WHERE id = ?`,
			[user.id],
		);

		// Update sessions with new email if stored
		await connection.query(
			`UPDATE user_sessions 
             SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.email', ?)
             WHERE user_id = ? AND is_active = true`,
			[user.new_email, user.id],
		);

		await connection.commit();

		res.json({
			message: "Email updated successfully",
			data: {
				oldEmail: user.email,
				newEmail: user.new_email,
			},
		});
	} catch (error) {
		await connection.rollback();
		console.error("Verify new email error:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		connection.release();
	}
});

// ==================== CANCEL EMAIL CHANGE ====================
router.post("/cancel-email-change", authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;

		const [result] = await db.query(
			`UPDATE users 
             SET new_email = NULL,
                 email_verification_token = NULL,
                 email_verification_token_expiry = NULL,
                 updated_at = NOW()
             WHERE id = ? AND new_email IS NOT NULL`,
			[userId],
		);

		if (result.affectedRows === 0) {
			return res.status(400).json({ error: "No pending email change" });
		}

		res.json({
			message: "Email change cancelled successfully",
		});
	} catch (error) {
		console.error("Cancel email change error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// ==================== CHANGE CRYPTO ADDRESS ====================
router.put(
	"/crypto-address",
	authMiddleware,
	validateAddCryptoAddress,
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { currency, network, address, label } = req.body;
			const userId = req.user.userId;

			const [result] = await db.query(
				`INSERT INTO crypto_addresses (user_id, currency, network, address, label) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE address = VALUES(address), label = VALUES(label), updated_at = NOW()`,
				[userId, currency.trim(), network.trim(), address.trim(), label ? label.trim() : null],
			);

			const [cryptoAddresses] = await db.query(
				`SELECT id, currency, network, address, label, created_at, updated_at
                 FROM crypto_addresses 
                 WHERE user_id = ?`,
				[userId],
			);

			res.status(201).json({
				message: "Crypto address updated successfully",
				data: { crypto_addresses: cryptoAddresses },
			});
		} catch (error) {
			console.error("Add crypto address error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	},
);

// ==================== DELETE CRYPTO ADDRESS ====================
router.delete("/crypto-address/:id", authMiddleware, async (req, res) => {
	try {
		const addressId = req.params.id;
		const userId = req.user.userId;
		
		const [result] = await db.query(
			`DELETE FROM crypto_addresses WHERE id = ? AND user_id = ?`,
			[addressId, userId]
		);
		
		if (result.affectedRows === 0) {
		    return res.status(404).json({ error: "Address not found or unauthorized to delete" });
		}
		
		res.json({ message: "Crypto address deleted successfully" });
	} catch (error) {
		console.error("Delete crypto address error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
