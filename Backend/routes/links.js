// routes/links.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { body, query, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const db = require("../config/database");
const tripleaService = require("../services/tripleaService");

// ==================== VALIDATION ====================
const validateCreateLink = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),
	body("amount")
		.isFloat({ min: 0.00000001 })
		.withMessage("Amount must be greater than 0"),
	body("currency").trim().notEmpty().withMessage("Currency is required"),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Description cannot exceed 500 characters"),
];

const validateFilters = [
	query("search").optional().trim(),
	query("dateFrom").optional().isISO8601().withMessage("Invalid date format"),
	query("dateTo").optional().isISO8601().withMessage("Invalid date format"),
	query("status")
		.optional()
		.isIn(["active", "used", "expired", "cancelled"])
		.withMessage("Invalid status"),
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),
];

// ==================== CREATE PAYMENT LINK ====================
router.post("/", authMiddleware, validateCreateLink, async (req, res) => {
	const connection = await db.getConnection();

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, amount, currency, description } = req.body;
		const userId = req.user.userId;

		// Get user's crypto address for the specified currency
		const [addresses] = await connection.query(
			`SELECT id, address, network 
             FROM crypto_addresses 
             WHERE user_id = ? AND currency = ? AND is_active = true AND is_verified = true 
             LIMIT 1`,
			[userId, currency],
		);

		if (addresses.length === 0) {
			return res.status(400).json({
				error: `No verified ${currency} address found. Please add and verify a ${currency} address first.`,
			});
		}

		const recipientAddress = addresses[0];

		// Generate unique code for the link
		const uniqueCode = crypto.randomBytes(16).toString("hex");
		const paymentLink = `${process.env.FRONTEND_URL}/pay/${uniqueCode}`;

		// Set expiry date (7 days from now)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		await connection.beginTransaction();

		// Create link record
		const [result] = await connection.query(
			`INSERT INTO payment_links 
             (user_id, name, amount, currency, description, status, unique_code, payment_url, expires_at) 
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
			[
				userId,
				name,
				amount,
				currency,
				description || null,
				uniqueCode,
				paymentLink,
				expiresAt,
			],
		);

		const linkId = result.insertId;

		// Log activity
		await connection.query(
			`INSERT INTO account_activity_log 
             (user_id, activity_type, description, metadata) 
             VALUES (?, 'LINK_CREATED', ?, ?)`,
			[
				userId,
				`Payment link created: ${name}`,
				JSON.stringify({ linkId, amount, currency }),
			],
		);

		await connection.commit();

		const [newLink] = await connection.query(
			`SELECT pl.*, u.name as user_name, u.email as user_email
             FROM payment_links pl
             JOIN users u ON pl.user_id = u.id
             WHERE pl.id = ?`,
			[linkId],
		);

		res.status(201).json({
			message: "Payment link created successfully",
			data: {
				link: {
					id: newLink[0].id,
					name: newLink[0].name,
					amount: parseFloat(newLink[0].amount),
					currency: newLink[0].currency,
					description: newLink[0].description,
					status: newLink[0].status,
					uniqueCode: newLink[0].unique_code,
					paymentUrl: newLink[0].payment_url,
					expiresAt: newLink[0].expires_at,
					createdAt: newLink[0].created_at,
				},
			},
		});
	} catch (error) {
		await connection.rollback();
		console.error("Create link error:", error);
		res.status(500).json({ error: "Failed to create payment link" });
	} finally {
		connection.release();
	}
});

// ==================== GET PAYMENT LINKS WITH FILTERS ====================
router.get("/", authMiddleware, validateFilters, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const userId = req.user.userId;
		const {
			search,
			dateFrom,
			dateTo,
			status,
			page = 1,
			limit = 10,
		} = req.query;

		let whereClause = "WHERE pl.user_id = ?";
		const params = [userId];

		// Search filter
		if (search) {
			whereClause +=
				" AND (pl.name LIKE ? OR pl.description LIKE ? OR pl.unique_code LIKE ?)";
			const searchTerm = `%${search}%`;
			params.push(searchTerm, searchTerm, searchTerm);
		}

		// Date range filter
		if (dateFrom) {
			whereClause += " AND pl.created_at >= ?";
			params.push(dateFrom);
		}

		if (dateTo) {
			whereClause += " AND pl.created_at <= ?";
			params.push(dateTo + " 23:59:59");
		}

		// Status filter
		if (status) {
			whereClause += " AND pl.status = ?";
			params.push(status);
		}

		// Get total count
		const [countResult] = await db.query(
			`SELECT COUNT(*) as total FROM payment_links pl ${whereClause}`,
			params,
		);
		const total = countResult[0].total;

		// Get paginated results
		const offset = (page - 1) * limit;
		const [links] = await db.query(
			`SELECT pl.*, 
                    (SELECT COUNT(*) FROM transactions t WHERE t.link_id = pl.id) as transaction_count
             FROM payment_links pl
             ${whereClause}
             ORDER BY pl.created_at DESC
             LIMIT ? OFFSET ?`,
			[...params, parseInt(limit), offset],
		);

		// Format links
		const formattedLinks = links.map((link) => ({
			id: link.id,
			name: link.name,
			amount: parseFloat(link.amount),
			currency: link.currency,
			description: link.description,
			status: link.status,
			uniqueCode: link.unique_code,
			paymentUrl: link.payment_url,
			transactionCount: link.transaction_count,
			expiresAt: link.expires_at,
			usedAt: link.used_at,
			createdAt: link.created_at,
			updatedAt: link.updated_at,
		}));

		res.json({
			data: {
				links: formattedLinks,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		console.error("Get links error:", error);
		res.status(500).json({ error: "Failed to fetch payment links" });
	}
});

// ==================== GET SINGLE PAYMENT LINK ====================
router.get("/:id", authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;
		const linkId = req.params.id;

		const [links] = await db.query(
			`SELECT pl.*, 
                    u.name as user_name, 
                    u.email as user_email,
                    GROUP_CONCAT(ca.address) as user_addresses
             FROM payment_links pl
             JOIN users u ON pl.user_id = u.id
             LEFT JOIN crypto_addresses ca ON ca.user_id = u.id 
                 AND ca.currency = pl.currency 
                 AND ca.is_active = true
             WHERE pl.id = ? AND pl.user_id = ?
             GROUP BY pl.id`,
			[linkId, userId],
		);

		if (links.length === 0) {
			return res.status(404).json({ error: "Link not found" });
		}

		const link = links[0];

		// Get associated transactions
		const [transactions] = await db.query(
			`SELECT * FROM transactions WHERE link_id = ? ORDER BY created_at DESC`,
			[linkId],
		);

		res.json({
			data: {
				link: {
					...link,
					amount: parseFloat(link.amount),
					transactions,
				},
			},
		});
	} catch (error) {
		console.error("Get link error:", error);
		res.status(500).json({ error: "Failed to fetch payment link" });
	}
});

// ==================== CANCEL PAYMENT LINK ====================
router.put("/:id/cancel", authMiddleware, async (req, res) => {
	const connection = await db.getConnection();

	try {
		const userId = req.user.userId;
		const linkId = req.params.id;

		await connection.beginTransaction();

		const [links] = await connection.query(
			`SELECT * FROM payment_links WHERE id = ? AND user_id = ? AND status = 'active'`,
			[linkId, userId],
		);

		if (links.length === 0) {
			return res.status(404).json({ error: "Active link not found" });
		}

		await connection.query(
			`UPDATE payment_links SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
			[linkId],
		);

		// Log activity
		await connection.query(
			`INSERT INTO account_activity_log 
             (user_id, activity_type, description, metadata) 
             VALUES (?, 'LINK_CANCELLED', ?, ?)`,
			[userId, `Payment link cancelled`, JSON.stringify({ linkId })],
		);

		await connection.commit();

		res.json({
			message: "Payment link cancelled successfully",
		});
	} catch (error) {
		await connection.rollback();
		console.error("Cancel link error:", error);
		res.status(500).json({ error: "Failed to cancel payment link" });
	} finally {
		connection.release();
	}
});

// ==================== PUBLIC: GET PAYMENT LINK BY CODE ====================
router.get("/public/:code", async (req, res) => {
	try {
		const { code } = req.params;

		const [links] = await db.query(
			`SELECT pl.*, u.name as merchant_name
             FROM payment_links pl
             JOIN users u ON pl.user_id = u.id
             WHERE pl.unique_code = ? AND pl.status = 'active' 
             AND pl.expires_at > NOW()`,
			[code],
		);

		if (links.length === 0) {
			return res
				.status(404)
				.json({ error: "Payment link not found or expired" });
		}

		const link = links[0];

		// Return minimal info for public view
		res.json({
			data: {
				link: {
					name: link.name,
					amount: parseFloat(link.amount),
					currency: link.currency,
					description: link.description,
					merchantName: link.merchant_name,
					expiresAt: link.expires_at,
				},
			},
		});
	} catch (error) {
		console.error("Get public link error:", error);
		res.status(500).json({ error: "Failed to fetch payment link" });
	}
});

// ==================== PROCESS PAYMENT FROM LINK ====================
router.post("/process-payment/:code", async (req, res) => {
	const connection = await db.getConnection();

	try {
		const { code } = req.params;
		const { customerName, customerEmail } = req.body;

		if (!customerEmail) {
			return res.status(400).json({ error: "Customer email is required" });
		}

		await connection.beginTransaction();

		// Get link details
		const [links] = await connection.query(
			`SELECT pl.*, u.id as merchant_id, u.email as merchant_email,
                    ca.address as recipient_address, ca.network
             FROM payment_links pl
             JOIN users u ON pl.user_id = u.id
             LEFT JOIN crypto_addresses ca ON ca.user_id = u.id 
                 AND ca.currency = pl.currency 
                 AND ca.is_active = true 
                 AND ca.is_verified = true
             WHERE pl.unique_code = ? AND pl.status = 'active' 
             AND pl.expires_at > NOW()
             LIMIT 1`,
			[code],
		);

		if (links.length === 0) {
			return res
				.status(404)
				.json({ error: "Payment link not found or expired" });
		}

		const link = links[0];

		if (!link.recipient_address) {
			return res
				.status(400)
				.json({ error: "Merchant has not set up a verified wallet address" });
		}

		// Generate order ID
		const orderId = `ORDER-${Date.now()}-${link.id}`;

		// Create payment request with Triple-A
		const paymentRequest = await tripleaService.makePaymentRequest({
			orderId,
			amount: link.amount,
			currency: link.currency,
			customerName: customerName || "Customer",
			customerEmail: customerEmail,
			linkId: link.id,
			userId: link.merchant_id,
			description: link.description,
			redirectUrl: `${process.env.FRONTEND_URL}/payment/success?link=${code}`,
			cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?link=${code}`,
		});

		// Create initial transaction record
		const [transactionResult] = await connection.query(
			`INSERT INTO transactions 
             (user_id, link_id, type, status, payment_id, payment_amount, 
              payment_currency, payment_network, payment_address,
              customer_email, customer_name, triplea_payment_data, 
              payment_received_at)
             VALUES (?, ?, 'payment_received', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
			[
				link.merchant_id,
				link.id,
				paymentRequest.payment_id,
				link.amount,
				link.currency,
				link.network,
				link.recipient_address,
				customerEmail,
				customerName || "Customer",
				JSON.stringify(paymentRequest),
			],
		);

		await connection.commit();

		// Redirect to Triple-A hosted payment page
		res.json({
			message: "Payment initiated",
			data: {
				hostedUrl: paymentRequest.hosted_url,
				paymentId: paymentRequest.payment_id,
				transactionId: transactionResult.insertId,
			},
		});
	} catch (error) {
		await connection.rollback();
		console.error("Process payment error:", error);
		res.status(500).json({
			error: "Failed to process payment",
			details: error.response?.data || error.message,
		});
	} finally {
		connection.release();
	}
});

module.exports = router;
