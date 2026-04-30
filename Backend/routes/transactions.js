// routes/transactions.js
const express = require("express");
const router = express.Router();
const { query, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const db = require("../config/database");

// ==================== GET USER TRANSACTIONS ====================
router.get("/", authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;
		const {
			type,
			status,
			currency,
			dateFrom,
			dateTo,
			page = 1,
			limit = 10,
		} = req.query;

		let whereClause = "WHERE t.user_id = ?";
		const params = [userId];

		if (type) {
			whereClause += " AND t.type = ?";
			params.push(type);
		}

		if (status) {
			whereClause += " AND t.status = ?";
			params.push(status);
		}

		if (currency) {
			whereClause += " AND (t.payment_currency = ? OR t.payout_currency = ?)";
			params.push(currency, currency);
		}

		if (dateFrom) {
			whereClause += " AND t.created_at >= ?";
			params.push(dateFrom);
		}

		if (dateTo) {
			whereClause += " AND t.created_at <= ?";
			params.push(dateTo + " 23:59:59");
		}

		// Get total count
		const [countResult] = await db.query(
			`SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
			params,
		);
		const total = countResult[0].total;

		// Get paginated results
		const offset = (page - 1) * limit;
		const [transactions] = await db.query(
			`SELECT t.*, pl.name as link_name
             FROM transactions t
             LEFT JOIN payment_links pl ON t.link_id = pl.id
             ${whereClause}
             ORDER BY t.created_at DESC
             LIMIT ? OFFSET ?`,
			[...params, parseInt(limit), offset],
		);

		// Calculate totals
		const [totals] = await db.query(
			`SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN t.type = 'payment_received' AND t.status = 'completed' THEN t.payment_amount ELSE 0 END) as total_received,
                SUM(CASE WHEN t.type = 'payout_sent' AND t.status = 'completed' THEN t.payout_amount ELSE 0 END) as total_payout,
                SUM(CASE WHEN t.type = 'fee_deducted' AND t.status = 'completed' THEN t.platform_fee ELSE 0 END) as total_fees
             FROM transactions t
             ${whereClause}`,
			params,
		);

		res.json({
			data: {
				transactions: transactions.map((t) => ({
					...t,
					payment_amount: t.payment_amount
						? parseFloat(t.payment_amount)
						: null,
					payout_amount: t.payout_amount ? parseFloat(t.payout_amount) : null,
					platform_fee: t.platform_fee ? parseFloat(t.platform_fee) : null,
					network_fee: t.network_fee ? parseFloat(t.network_fee) : null,
				})),
				summary: {
					totalTransactions: totals[0].total_transactions,
					totalReceived: totals[0].total_received
						? parseFloat(totals[0].total_received)
						: 0,
					totalPayout: totals[0].total_payout
						? parseFloat(totals[0].total_payout)
						: 0,
					totalFees: totals[0].total_fees
						? parseFloat(totals[0].total_fees)
						: 0,
				},
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		console.error("Get transactions error:", error);
		res.status(500).json({ error: "Failed to fetch transactions" });
	}
});

// ==================== GET SINGLE TRANSACTION ====================
router.get("/:id", authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;
		const transactionId = req.params.id;

		const [transactions] = await db.query(
			`SELECT t.*, pl.name as link_name, pl.description as link_description
             FROM transactions t
             LEFT JOIN payment_links pl ON t.link_id = pl.id
             WHERE t.id = ? AND t.user_id = ?`,
			[transactionId, userId],
		);

		if (transactions.length === 0) {
			return res.status(404).json({ error: "Transaction not found" });
		}

		res.json({
			data: {
				transaction: {
					...transactions[0],
					payment_amount: parseFloat(transactions[0].payment_amount),
					payout_amount: parseFloat(transactions[0].payout_amount),
					platform_fee: parseFloat(transactions[0].platform_fee),
					network_fee: parseFloat(transactions[0].network_fee),
				},
			},
		});
	} catch (error) {
		console.error("Get transaction error:", error);
		res.status(500).json({ error: "Failed to fetch transaction" });
	}
});

// ==================== GET TRANSACTION STATS ====================
router.get("/stats/summary", authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;

		const [stats] = await db.query(
			`SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'payment_received' AND status = 'completed' THEN payment_amount ELSE 0 END) as total_received,
                SUM(CASE WHEN type = 'payout_sent' AND status = 'completed' THEN payout_amount ELSE 0 END) as total_payout,
                SUM(CASE WHEN type = 'fee_deducted' THEN platform_fee ELSE 0 END) as total_fees,
                COUNT(DISTINCT CASE WHEN status = 'completed' THEN date(created_at) END) as active_days,
                MIN(created_at) as first_transaction,
                MAX(created_at) as last_transaction
             FROM transactions 
             WHERE user_id = ?`,
			[userId],
		);

		// Get monthly stats for the last 12 months
		const [monthlyStats] = await db.query(
			`SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(CASE WHEN type = 'payment_received' AND status = 'completed' THEN payment_amount ELSE 0 END) as received,
                SUM(CASE WHEN type = 'payout_sent' AND status = 'completed' THEN payout_amount ELSE 0 END) as payout
             FROM transactions 
             WHERE user_id = ? 
             AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month DESC`,
			[userId],
		);

		res.json({
			data: {
				summary: {
					totalTransactions: stats[0].total_transactions,
					totalReceived: stats[0].total_received
						? parseFloat(stats[0].total_received)
						: 0,
					totalPayout: stats[0].total_payout
						? parseFloat(stats[0].total_payout)
						: 0,
					totalFees: stats[0].total_fees ? parseFloat(stats[0].total_fees) : 0,
					activeDays: stats[0].active_days,
					firstTransaction: stats[0].first_transaction,
					lastTransaction: stats[0].last_transaction,
				},
				monthlyStats: monthlyStats.map((m) => ({
					month: m.month,
					count: m.count,
					received: m.received ? parseFloat(m.received) : 0,
					payout: m.payout ? parseFloat(m.payout) : 0,
				})),
			},
		});
	} catch (error) {
		console.error("Get transaction stats error:", error);
		res.status(500).json({ error: "Failed to fetch transaction stats" });
	}
});

module.exports = router;
