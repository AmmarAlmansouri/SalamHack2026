// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../config/database"); // Your MySQL connection pool

// Email transporter configuration
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: process.env.SMTP_SECURE === "true",
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Validation middleware (simple example)
const validateSignup = (req, res, next) => {
	const { email, password, name } = req.body;

	if (!email || !password || !name) {
		return res.status(400).json({
			error: "Missing required fields",
			required: ["email", "password", "name"],
		});
	}

	// Email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return res.status(400).json({ error: "Invalid email format" });
	}

	// Password validation (minimum 8 characters, at least 1 number and 1 letter)
	if (password.length < 8) {
		return res
			.status(400)
			.json({ error: "Password must be at least 8 characters" });
	}

	next();
};

// Helper function to generate JWT token
const generateToken = (userId, email) => {
	return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
	try {
		await transporter.sendMail({
			from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
			to,
			subject,
			html,
		});
		return true;
	} catch (error) {
		console.error("Email sending failed:", error);
		return false;
	}
};

// ==================== SIGNUP ROUTE ====================
router.post("/signup", validateSignup, async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { name, email, password } = req.body;

		await connection.beginTransaction();

		// Check if user already exists
		const [existingUsers] = await connection.query(
			"SELECT id FROM users WHERE email = ?",
			[email.toLowerCase()],
		);

		if (existingUsers.length > 0) {
			return res.status(409).json({
				error: "Email already registered",
			});
		}

		// Hash password
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Generate email confirmation token
		const confirmationToken = crypto.randomBytes(32).toString("hex");
		const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Insert new user
		const [result] = await connection.query(
			`INSERT INTO users (name, email, password, confirmation_token, confirmation_token_expiry, is_verified) 
             VALUES (?, ?, ?, ?, ?, ?)`,
			[
				name,
				email.toLowerCase(),
				hashedPassword,
				confirmationToken,
				confirmationTokenExpiry,
				false,
			],
		);

		const userId = result.insertId;

		// Create JWT token
		const token = generateToken(userId, email);

		// Send confirmation email
		const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;
		const emailSent = await sendEmail(
			email,
			"Confirm Your Email",
			`
                <h1>Welcome ${name}!</h1>
                <p>Please confirm your email by clicking the link below:</p>
                <a href="${confirmationLink}">Confirm Email</a>
                <p>This link will expire in 24 hours.</p>
            `,
		);

		await connection.query(
			`INSERT INTO user_sessions (user_id, token, ip_address, created_at, expires_at, last_used_at) 
             VALUES (?, ?, ?, NOW(), ?, NOW()) `,
			[userId, token, req.ip, confirmationTokenExpiry],
		);

		await connection.commit();

		res.status(201).json({
			message: "User created successfully",
			data: {
				user: {
					id: userId,
					name,
					email: email.toLowerCase(),
					is_verified: false,
				},
				token,
			},
			warning: !emailSent
				? "Account created but confirmation email could not be sent. Please contact support."
				: undefined,
		});
	} catch (error) {
		await connection.rollback();
		console.error("Signup error:", error);
		res.status(500).json({ error: "Internal server error during signup" });
	} finally {
		connection.release();
	}
});

// ==================== CONFIRM EMAIL ROUTE ====================
router.post("/confirm-email", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { token } = req.body;

		if (!token) {
			return res.status(400).json({ error: "Confirmation token is required" });
		}

		await connection.beginTransaction();

		// Find user with valid token
		const [users] = await connection.query(
			`SELECT id, email, name, is_verified 
              FROM users 
              WHERE confirmation_token = ? 
              AND confirmation_token_expiry > NOW()`,
			[token],
		);

		if (users.length === 0) {
			return res.status(400).json({
				error: "Invalid or expired confirmation token",
			});
		}

		const user = users[0];

		if (user.is_verified) {
			return res.status(400).json({
				error: "Email already confirmed",
			});
		}

		// Update user verification status
		await connection.query(
			`UPDATE users 
             SET is_verified = true, 
                 confirmation_token = NULL, 
                 confirmation_token_expiry = NULL,
                 email_verified_at = NOW() 
             WHERE id = ?`,
			[user.id],
		);

		await connection.commit();

		// Send welcome email
		await sendEmail(
			user.email,
			"Email Confirmed Successfully",
			`<h1>Email Confirmed!</h1><p>Your email has been successfully confirmed. You can now use all features of our platform.</p>`,
		);

		res.json({
			message: "Email confirmed successfully",
			data: {
				email: user.email,
			},
		});
	} catch (error) {
		await connection.rollback();
		console.error("Email confirmation error:", error);
		res
			.status(500)
			.json({ error: "Internal server error during email confirmation" });
	} finally {
		connection.release();
	}
});

// ==================== LOGIN ROUTE ====================
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				error: "Email and password are required",
			});
		}

		// Find user by email
		const [users] = await db.query(
			`SELECT id, name, email, password, is_verified, failed_login_attempts, locked_until 
             FROM users 
             WHERE email = ?`,
			[email.toLowerCase()],
		);

		if (users.length === 0) {
			return res.status(401).json({
				error: "Invalid email or password",
			});
		}

		const user = users[0];
		const userId = user?.id;

		// Check if account is locked
		if (user.locked_until && new Date(user.locked_until) > new Date()) {
			const minutesLeft = Math.ceil(
				(new Date(user.locked_until) - new Date()) / 60000,
			);
			return res.status(423).json({
				error: `Account is temporarily locked. Try again in ${minutesLeft} minutes.`,
			});
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			// Increment failed login attempts
			const failedAttempts = user.failed_login_attempts + 1;
			let lockedUntil = null;

			// Lock account after 5 failed attempts for 15 minutes
			if (failedAttempts >= 5) {
				lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
			}

			await db.query(
				`UPDATE users 
                 SET failed_login_attempts = ?, 
                     locked_until = ?,
                     last_failed_login = NOW() 
                 WHERE id = ?`,
				[failedAttempts, lockedUntil, user.id],
			);

			return res.status(401).json({
				error: "Invalid email or password",
				remainingAttempts: Math.max(0, 5 - failedAttempts),
			});
		}

		// Check if email is verified
		if (!user.is_verified) {
			return res.status(403).json({
				error: "Please confirm your email before logging in",
				needsConfirmation: true,
				email: user.email,
			});
		}

		// Reset failed login attempts
		await db.query(
			`UPDATE users 
             SET failed_login_attempts = 0, 
                 locked_until = NULL,
                 last_login = NOW() 
             WHERE id = ?`,
			[user.id],
		);

		// Generate JWT token
		const token = generateToken(user.id, user.email);

		// Optional: Generate refresh token
		const refreshToken = jwt.sign(
			{ userId: user.id },
			process.env.REFRESH_TOKEN_SECRET || "refresh-secret-key",
			{ expiresIn: "7d" },
		);

		await db.query(`DELETE FROM user_sessions WHERE user_id = ?`, [
			userId,
		]);

		await db.query(
			`INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, created_at, expires_at, last_used_at) 
             VALUES (?, ?, ?, ?, NOW(), ?, NOW()) `,
			[
				userId,
				token,
				refreshToken,
				req.ip,
				new Date(Date.now() + 24 * 60 * 60 * 1000),
			],
		);

		res.json({
			message: "Login successful",
			data: {
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					is_verified: user.is_verified,
				},
				token,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error during login" });
	}
});

// ==================== FORGOT PASSWORD ROUTE ====================
router.post("/forgot-password", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		await connection.beginTransaction();

		// Find user by email (even if not verified, allow password reset)
		const [users] = await connection.query(
			"SELECT id, email, name FROM users WHERE email = ?",
			[email.toLowerCase()],
		);

		// Always return success message to prevent email enumeration
		if (users.length === 0) {
			return res.json({
				message:
					"If an account with that email exists, a password reset link has been sent.",
			});
		}

		const user = users[0];

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

		// Save reset token
		await connection.query(
			`UPDATE users 
             SET reset_password_token = ?, 
                 reset_password_expiry = ? 
             WHERE id = ?`,
			[resetToken, resetTokenExpiry, user.id],
		);

		// Send reset email
		const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
		await sendEmail(
			user.email,
			"Reset Your Password",
			`
                <h1>Password Reset Request</h1>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password. Click the link below to set a new password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
		);

		await connection.commit();

		res.json({
			message:
				"If an account with that email exists, a password reset link has been sent.",
		});
	} catch (error) {
		await connection.rollback();
		console.error("Forgot password error:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		connection.release();
	}
});

// ==================== RESET PASSWORD ROUTE ====================
router.post("/reset-password", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			return res.status(400).json({
				error: "Reset token and new password are required",
			});
		}

		// Validate password strength
		if (newPassword.length < 8) {
			return res.status(400).json({
				error: "Password must be at least 8 characters",
			});
		}

		await connection.beginTransaction();

		// Find user with valid reset token
		const [users] = await connection.query(
			`SELECT id 
             FROM users 
             WHERE reset_password_token = ? 
             AND reset_password_expiry > NOW()`,
			[token],
		);

		if (users.length === 0) {
			return res.status(400).json({
				error: "Invalid or expired reset token",
			});
		}

		const user = users[0];

		// Hash new password
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// Update password and clear reset token
		await connection.query(
			`UPDATE users 
             SET password = ?, 
                 reset_password_token = NULL, 
                 reset_password_expiry = NULL,
                 password_changed_at = NOW(),
                 failed_login_attempts = 0,
                 locked_until = NULL
             WHERE id = ?`,
			[hashedPassword, user.id],
		);

		// Invalidate all existing sessions (optional, if you store sessions)
		await connection.query(
			`UPDATE user_sessions 
             SET is_active = false 
             WHERE user_id = ? AND is_active = true`,
			[user.id],
		);

		await connection.commit();

		res.json({
			message:
				"Password reset successful. You can now login with your new password.",
		});
	} catch (error) {
		await connection.rollback();
		console.error("Reset password error:", error);
		res
			.status(500)
			.json({ error: "Internal server error during password reset" });
	} finally {
		connection.release();
	}
});

// ==================== RESEND CONFIRMATION EMAIL ====================
router.post("/resend-confirmation", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		// Find user
		const [users] = await connection.query(
			"SELECT id, name, email, is_verified FROM users WHERE email = ?",
			[email.toLowerCase()],
		);

		if (users.length === 0) {
			return res.json({
				message:
					"If an account with that email exists and is not verified, a confirmation email has been sent.",
			});
		}

		const user = users[0];

		if (user.is_verified) {
			return res.status(400).json({ error: "Email is already verified" });
		}

		// Generate new confirmation token
		const confirmationToken = crypto.randomBytes(32).toString("hex");
		const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

		await connection.query(
			`UPDATE users 
             SET confirmation_token = ?, 
                 confirmation_token_expiry = ? 
             WHERE id = ?`,
			[confirmationToken, confirmationTokenExpiry, user.id],
		);

		// Send confirmation email
		const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;
		await sendEmail(
			user.email,
			"Confirm Your Email",
			`
                <h1>Confirm Your Email</h1>
                <p>Please confirm your email by clicking the link below:</p>
                <a href="${confirmationLink}">Confirm Email</a>
                <p>This link will expire in 24 hours.</p>
            `,
		);

		res.json({
			message: "Confirmation email sent successfully",
		});
	} catch (error) {
		console.error("Resend confirmation error:", error);
		res.status(500).json({ error: "Internal server error" });
	} finally {
		connection.release();
	}
});

module.exports = router;
