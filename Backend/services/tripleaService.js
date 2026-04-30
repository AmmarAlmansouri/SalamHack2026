// services/tripleaService.js
const axios = require("axios");
const crypto = require("crypto");

class TripleAService {
	constructor() {
		this.baseURL = process.env.TRIPLEA_BASE_URL || "https://api.triple-a.io/v1";
		this.apiKey = process.env.TRIPLEA_API_KEY;
		this.apiSecret = process.env.TRIPLEA_API_SECRET;
		this.merchantId = process.env.TRIPLEA_MERCHANT_ID;
	}

	// Generate signature for API requests
	generateSignature(timestamp, method, path, body = "") {
		const message = `${timestamp}${method}${path}${body}`;
		return crypto
			.createHmac("sha256", this.apiSecret)
			.update(message)
			.digest("hex");
	}

	// Make authenticated API request
	async makeRequest(method, path, data = null) {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const body = data ? JSON.stringify(data) : "";
		const signature = this.generateSignature(timestamp, method, path, body);

		const headers = {
			"Content-Type": "application/json",
			"x-api-key": this.apiKey,
			"x-api-timestamp": timestamp,
			"x-api-signature": signature,
			"x-merchant-id": this.merchantId,
		};

		try {
			const response = await axios({
				method,
				url: `${this.baseURL}${path}`,
				headers,
				data: data || undefined,
			});

			return response.data;
		} catch (error) {
			console.error(
				"Triple-A API Error:",
				error.response?.data || error.message,
			);
			throw error;
		}
	}

	// Make a payment request
	async makePaymentRequest(paymentData) {
		const path = "/payment";
		const payload = {
			merchant_id: this.merchantId,
			order_id: paymentData.orderId,
			amount: paymentData.amount.toString(),
			currency: paymentData.currency,
			customer: {
				name: paymentData.customerName || "Customer",
				email: paymentData.customerEmail || "customer@example.com",
			},
			notification: {
				webhook_url: `${process.env.APP_URL}/api/webhooks/triplea`,
				redirect_url: paymentData.redirectUrl,
				cancel_url: paymentData.cancelUrl,
			},
			metadata: {
				link_id: paymentData.linkId,
				user_id: paymentData.userId,
				description: paymentData.description,
			},
		};

		return await this.makeRequest("POST", path, payload);
	}

	// Get payment status
	async getPaymentStatus(paymentId) {
		const path = `/payment/${paymentId}`;
		return await this.makeRequest("GET", path);
	}

	// Prepare a crypto payout (Phase 1)
	async preparePayout(payoutData) {
		const path = "/payout";
		const payload = {
			merchant_id: this.merchantId,
			payout_id: payoutData.payoutId,
			amount: payoutData.amount.toString(),
			currency: payoutData.currency,
			network: payoutData.network,
			recipient: {
				address: payoutData.recipientAddress,
			},
			notification: {
				webhook_url: `${process.env.APP_URL}/api/webhooks/triplea/payout`,
			},
			metadata: {
				payment_id: payoutData.paymentId,
				user_id: payoutData.userId,
				link_id: payoutData.linkId,
			},
		};

		return await this.makeRequest("POST", path, payload);
	}

	// Confirm a crypto payout (Phase 2)
	async confirmPayout(payoutId) {
		const path = `/payout/${payoutId}/confirm`;
		return await this.makeRequest("POST", path, {});
	}

	// Get payout status
	async getPayoutStatus(payoutId) {
		const path = `/payout/${payoutId}`;
		return await this.makeRequest("GET", path);
	}

	// Verify webhook signature
	verifyWebhookSignature(payload, signature) {
		const computedSignature = crypto
			.createHmac("sha256", this.apiSecret)
			.update(JSON.stringify(payload))
			.digest("hex");

		return crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(computedSignature),
		);
	}
}

module.exports = new TripleAService();
