// routes/webhooks.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const tripleaService = require("../services/tripleaService");

// ==================== TRIPLE-A WEBHOOK ====================
router.post("/triplea", async (req, res) => {
	const connection = await db.getConnection();

	try {
		// Verify webhook signature
		const signature = req.headers["x-api-signature"];
		if (!tripleaService.verifyWebhookSignature(req.body, signature)) {
			return res.status(401).json({ error: "Invalid signature" });
		}

		const webhookData = req.body;
		console.log("Webhook received:", webhookData);

		await connection.beginTransaction();

		const { payment_id, status, amount, currency, metadata } = webhookData;

		// Find transaction
		const [transactions] = await connection.query(
			`SELECT * FROM transactions WHERE payment_id = ?`,
			[payment_id],
		);

		if (transactions.length === 0) {
			return res.status(404).json({ error: "Transaction not found" });
		}

		const transaction = transactions[0];

		// Get platform fee configuration
		const [feeConfig] = await connection.query(
			`SELECT fee_percentage, min_fee_amount, max_fee_amount 
             FROM platform_fees 
             WHERE is_active = true 
             ORDER BY created_at DESC 
             LIMIT 1`,
		);

		const feePercentage = feeConfig[0]?.fee_percentage || 2.5;

		if (status === "paid") {
			// Update transaction status
			await connection.query(
				`UPDATE transactions 
                 SET status = 'processing', 
                     payment_status = 'completed',
                     payment_received_at = NOW(),
                     triplea_webhook_data = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
				[JSON.stringify(webhookData), transaction.id],
			);

			// Update payment link status
			if (transaction.link_id) {
				await connection.query(
					`UPDATE payment_links 
                     SET status = 'used', used_at = NOW(), updated_at = NOW() 
                     WHERE id = ?`,
					[transaction.link_id],
				);
			}

			// Calculate platform fee
			let platformFee = (amount * feePercentage) / 100;
			const minFee = parseFloat(feeConfig[0]?.min_fee_amount || 1);
			const maxFee = parseFloat(feeConfig[0]?.max_fee_amount || 100);

			platformFee = Math.max(minFee, Math.min(maxFee, platformFee));
			const payoutAmount = amount - platformFee;

			// Get user's wallet address
			const [userAddress] = await connection.query(
				`SELECT ca.address, ca.network 
                 FROM crypto_addresses ca
                 JOIN users u ON ca.user_id = u.id
                 WHERE ca.user_id = ? 
                 AND ca.currency = ? 
                 AND ca.is_active = true 
                 AND ca.is_verified = true
                 LIMIT 1`,
				[transaction.user_id, transaction.payment_currency],
			);

			if (userAddress.length > 0) {
				const walletAddress = userAddress[0];

				// Prepare payout
				const payoutId = `PAYOUT-${Date.now()}-${transaction.user_id}`;

				const payoutRequest = await tripleaService.preparePayout({
					payoutId,
					amount: payoutAmount,
					currency: transaction.payment_currency,
					network: walletAddress.network,
					recipientAddress: walletAddress.address,
					paymentId: payment_id,
					userId: transaction.user_id,
					linkId: transaction.link_id,
				});

				// Create payout transaction
				await connection.query(
					`INSERT INTO transactions 
                     (user_id, link_id, type, status, payout_id, 
                      payout_amount, payout_currency, payout_network, 
                      payout_address, platform_fee, platform_fee_percentage,
                      triplea_payout_data, created_at)
                     VALUES (?, ?, 'payout_sent', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
					[
						transaction.user_id,
						transaction.link_id,
						payoutRequest.payout_id,
						payoutAmount,
						transaction.payment_currency,
						walletAddress.network,
						walletAddress.address,
						platformFee,
						feePercentage,
						JSON.stringify(payoutRequest),
					],
				);

				// Confirm payout
				await tripleaService.confirmPayout(payoutRequest.payout_id);

				// Update user wallet balance
				await connection.query(
					`INSERT INTO user_wallets (user_id, currency, balance, total_received) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     balance = balance + ?,
                     total_received = total_received + ?,
                     updated_at = NOW()`,
					[
						transaction.user_id,
						transaction.payment_currency,
						payoutAmount,
						payoutAmount,
						payoutAmount,
						payoutAmount,
					],
				);
			}

			await connection.commit();

			res.json({ message: "Payment processed successfully" });
		} else if (status === "failed" || status === "expired") {
			// Update transaction as failed
			await connection.query(
				`UPDATE transactions 
                 SET status = 'failed',
                     payment_status = ?,
                     failed_at = NOW(),
                     triplea_webhook_data = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
				[status, JSON.stringify(webhookData), transaction.id],
			);

			await connection.commit();

			res.json({ message: "Payment marked as failed" });
		}
	} catch (error) {
		await connection.rollback();
		console.error("Webhook error:", error);
		res.status(500).json({ error: "Failed to process webhook" });
	} finally {
		connection.release();
	}
});

// ==================== TRIPLE-A PAYOUT WEBHOOK ====================
router.post("/triplea/payout", async (req, res) => {
	const connection = await db.getConnection();

	try {
		// Verify webhook signature
		const signature = req.headers["x-api-signature"];
		if (!tripleaService.verifyWebhookSignature(req.body, signature)) {
			return res.status(401).json({ error: "Invalid signature" });
		}

		const webhookData = req.body;
		console.log("Payout webhook received:", webhookData);

		await connection.beginTransaction();

		const { payout_id, status, tx_hash } = webhookData;

		// Find payout transaction
		const [transactions] = await connection.query(
			`SELECT * FROM transactions WHERE payout_id = ?`,
			[payout_id],
		);

		if (transactions.length === 0) {
			return res.status(404).json({ error: "Payout transaction not found" });
		}

		const transaction = transactions[0];

		if (status === "completed") {
			// Update payout transaction
			await connection.query(
				`UPDATE transactions 
                 SET status = 'completed',
                     payout_status = 'completed',
                     payout_tx_hash = ?,
                     payout_sent_at = NOW(),
                     completed_at = NOW(),
                     triplea_payout_data = JSON_MERGE_PATCH(
                         COALESCE(triplea_payout_data, '{}'),
                         ?
                     ),
                     updated_at = NOW()
                 WHERE id = ?`,
				[tx_hash, JSON.stringify(webhookData), transaction.id],
			);

			// Update parent payment transaction
			if (transaction.link_id) {
				await connection.query(
					`UPDATE transactions 
                     SET status = 'completed',
                         completed_at = NOW(),
                         updated_at = NOW()
                     WHERE link_id = ? 
                     AND type = 'payment_received'
                     AND status = 'processing'`,
					[transaction.link_id],
				);
			}
		} else if (status === "failed") {
			// Update payout transaction as failed
			await connection.query(
				`UPDATE transactions 
                 SET status = 'failed',
                     payout_status = 'failed',
                     failed_at = NOW(),
                     triplea_payout_data = JSON_MERGE_PATCH(
                         COALESCE(triplea_payout_data, '{}'),
                         ?
                     ),
                     updated_at = NOW()
                 WHERE id = ?`,
				[JSON.stringify(webhookData), transaction.id],
			);

			// Refund handling logic could go here
		}

		await connection.commit();

		res.json({ message: "Payout webhook processed" });
	} catch (error) {
		await connection.rollback();
		console.error("Payout webhook error:", error);
		res.status(500).json({ error: "Failed to process payout webhook" });
	} finally {
		connection.release();
	}
});

module.exports = router;
