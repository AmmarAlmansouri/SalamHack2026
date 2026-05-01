// test-all.js — End-to-end test suite for the entire backend
// Tests: Auth → Profile → Crypto Addresses → Payment Links → Mock Triple-A flow
//
// Usage: node test-all.js

require("dotenv").config();
const axios = require("axios");

const BASE = "http://localhost:3000/api";
const MOCK_BASE = "http://localhost:4000";

// Test user credentials
const TEST_USER = {
	name: "Test User",
	email: `testuser_${Date.now()}@example.com`,
	password: "TestPass123!",
};

let TOKEN = null;
let USER_ID = null;
let CRYPTO_ADDRESS_ID = null;
let PAYMENT_LINK_ID = null;
let PAYMENT_LINK_CODE = null;

const log = (emoji, msg) => console.log(`${emoji}  ${msg}`);
const pass = (msg) => log("✅", msg);
const fail = (msg, err) => {
	log("❌", msg);
	if (err?.response?.data) console.log("   ", JSON.stringify(err.response.data));
	else if (err?.message) console.log("   ", err.message);
};

const headers = () => ({
	Authorization: `Bearer ${TOKEN}`,
	"Content-Type": "application/json",
});

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────────────────────
async function testMockServerHealth() {
	log("🔵", "=== 1. Mock Triple-A Server Health ===");
	try {
		const res = await axios.get(`${MOCK_BASE}/dashboard`);
		if (res.status === 200) pass("Mock server is responding on :4000");
		else fail("Mock server returned unexpected status: " + res.status);
	} catch (err) {
		fail("Mock server is NOT running on :4000", err);
		throw new Error("Mock server not available — aborting tests");
	}
}

// ────────────────────────────────────────────────────────────────
async function testBackendHealth() {
	log("🔵", "=== 2. Backend Server Health ===");
	try {
		// Just hit a route that doesn't require auth
		const res = await axios.post(`${BASE}/auth/login`, {
			email: "nonexistent@test.com",
			password: "wrong",
		});
		// We expect 401 — that means the server is alive
		fail("Expected 401 but got success");
	} catch (err) {
		if (err.response?.status === 401) {
			pass("Backend is responding on :3000 (got expected 401)");
		} else {
			fail("Backend not responding properly", err);
			throw new Error("Backend not available — aborting tests");
		}
	}
}

// ────────────────────────────────────────────────────────────────
async function testSignup() {
	log("🔵", "=== 3. Signup ===");
	try {
		const res = await axios.post(`${BASE}/auth/signup`, TEST_USER);
		if (res.status === 201 && res.data.data?.token) {
			TOKEN = res.data.data.token;
			USER_ID = res.data.data.user.id;
			pass(`Signup succeeded — userId=${USER_ID}`);
		} else {
			fail("Signup returned unexpected response", { message: JSON.stringify(res.data) });
		}
	} catch (err) {
		fail("Signup failed", err);
		throw new Error("Cannot proceed without signup");
	}
}

// ────────────────────────────────────────────────────────────────
async function testVerifyEmail() {
	log("🔵", "=== 4. Auto-verify email ===");
	// Directly verify in DB since we can't receive emails in tests
	try {
		const db = require("./config/database");
		await db.query(
			`UPDATE users SET is_verified = true, email_verified_at = NOW(), confirmation_token = NULL WHERE id = ?`,
			[USER_ID]
		);
		pass("Email auto-verified in DB");
		await db.end();
	} catch (err) {
		fail("DB verification failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testLogin() {
	log("🔵", "=== 5. Login ===");
	try {
		const res = await axios.post(`${BASE}/auth/login`, {
			email: TEST_USER.email,
			password: TEST_USER.password,
		});
		if (res.data.data?.token) {
			TOKEN = res.data.data.token;
			pass("Login succeeded, got fresh token");
		} else {
			fail("Login returned unexpected response");
		}
	} catch (err) {
		fail("Login failed", err);
		throw new Error("Cannot proceed without login");
	}
}

// ────────────────────────────────────────────────────────────────
async function testGetProfile() {
	log("🔵", "=== 6. GET /account/profile ===");
	try {
		const res = await axios.get(`${BASE}/account/profile`, { headers: headers() });
		const user = res.data.user;
		if (user.id && user.email && Array.isArray(user.crypto_addresses)) {
			pass(`Profile loaded: ${user.name} (${user.email}), ${user.crypto_addresses.length} addresses`);
		} else {
			fail("Profile missing expected fields", { message: JSON.stringify(user) });
		}
	} catch (err) {
		fail("GET /profile failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testAddCryptoAddress() {
	log("🔵", "=== 7. PUT /account/crypto-address ===");
	try {
		const res = await axios.put(
			`${BASE}/account/crypto-address`,
			{
				currency: "BTC",
				network: "Bitcoin",
				address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
				label: "My BTC Wallet",
			},
			{ headers: headers() }
		);
		if (res.status === 201 && res.data.data?.crypto_addresses) {
			const addrs = res.data.data.crypto_addresses;
			CRYPTO_ADDRESS_ID = addrs[0]?.id;
			pass(`Address added, id=${CRYPTO_ADDRESS_ID}, total=${addrs.length}`);
		} else {
			fail("Add address returned unexpected response");
		}
	} catch (err) {
		fail("PUT /crypto-address failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testAddSecondAddress() {
	log("🔵", "=== 8. Add second crypto address (ETH) ===");
	try {
		const res = await axios.put(
			`${BASE}/account/crypto-address`,
			{
				currency: "ETH",
				network: "ERC20",
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
				label: "My ETH Wallet",
			},
			{ headers: headers() }
		);
		if (res.status === 201) {
			const addrs = res.data.data.crypto_addresses;
			pass(`Second address added, total=${addrs.length}`);
		}
	} catch (err) {
		fail("Second address failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testUpsertAddress() {
	log("🔵", "=== 9. Upsert existing address (same currency+network, new address) ===");
	try {
		const res = await axios.put(
			`${BASE}/account/crypto-address`,
			{
				currency: "BTC",
				network: "Bitcoin",
				address: "bc1q9h7dksnq9pwecrgfx7mstxa5xtkkvaw96q5y8s",
				label: "Updated BTC Wallet",
			},
			{ headers: headers() }
		);
		if (res.status === 201) {
			const btcAddr = res.data.data.crypto_addresses.find((a) => a.currency === "BTC");
			if (btcAddr?.label === "Updated BTC Wallet") {
				pass("Upsert worked — BTC address updated");
			} else {
				fail("Upsert did not update the existing row");
			}
		}
	} catch (err) {
		fail("Upsert failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testDeleteAddress() {
	log("🔵", "=== 10. DELETE /account/crypto-address/:id ===");
	try {
		// Delete the ETH address (second one added)
		const profileRes = await axios.get(`${BASE}/account/profile`, { headers: headers() });
		const ethAddr = profileRes.data.user.crypto_addresses.find((a) => a.currency === "ETH");
		if (!ethAddr) {
			fail("No ETH address to delete");
			return;
		}

		const res = await axios.delete(`${BASE}/account/crypto-address/${ethAddr.id}`, {
			headers: headers(),
		});
		if (res.data.message?.includes("deleted")) {
			pass(`ETH address id=${ethAddr.id} deleted`);
		}
	} catch (err) {
		fail("DELETE /crypto-address failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testCreatePaymentLink() {
	log("🔵", "=== 11. POST /links (create payment link) ===");
	try {
		const res = await axios.post(
			`${BASE}/links`,
			{
				name: "Test Invoice",
				amount: 0.005,
				currency: "BTC",
				description: "Test payment link for integration testing",
			},
			{ headers: headers() }
		);
		if (res.status === 201 && res.data.data?.link) {
			const link = res.data.data.link;
			PAYMENT_LINK_ID = link.id;
			PAYMENT_LINK_CODE = link.uniqueCode;
			pass(`Payment link created: id=${PAYMENT_LINK_ID}, code=${PAYMENT_LINK_CODE}`);
		} else {
			fail("Create link returned unexpected response");
		}
	} catch (err) {
		fail("POST /links failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testGetPaymentLinks() {
	log("🔵", "=== 12. GET /links (list payment links) ===");
	try {
		const res = await axios.get(`${BASE}/links`, { headers: headers() });
		const links = res.data.data?.links;
		if (Array.isArray(links)) {
			pass(`Listed ${links.length} payment link(s)`);
		} else {
			fail("List links returned unexpected format");
		}
	} catch (err) {
		fail("GET /links failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testGetPublicLink() {
	log("🔵", "=== 13. GET /links/public/:code (public link view) ===");
	if (!PAYMENT_LINK_CODE) {
		fail("No payment link code — skipping");
		return;
	}
	try {
		const res = await axios.get(`${BASE}/links/public/${PAYMENT_LINK_CODE}`);
		const link = res.data.data?.link;
		if (link?.name === "Test Invoice") {
			pass(`Public link loaded: "${link.name}" — ${link.amount} ${link.currency}`);
		} else {
			fail("Public link returned unexpected data");
		}
	} catch (err) {
		fail("GET /links/public/:code failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testProcessPayment() {
	log("🔵", "=== 14. POST /links/process-payment/:code → Mock Triple-A ===");
	if (!PAYMENT_LINK_CODE) {
		fail("No payment link code — skipping");
		return;
	}
	try {
		const res = await axios.post(`${BASE}/links/process-payment/${PAYMENT_LINK_CODE}`, {
			customerName: "John Doe",
			customerEmail: "john@example.com",
		});
		if (res.data.data?.hostedUrl && res.data.data?.paymentId) {
			pass(`Payment initiated: paymentId=${res.data.data.paymentId}`);
			pass(`  Hosted URL: ${res.data.data.hostedUrl}`);

			// Wait for auto-webhook (PAYMENT_WEBHOOK_DELAY is 5s)
			log("⏳", "Waiting 7s for auto 'paid' webhook from mock server...");
			await sleep(7000);
			pass("Auto-webhook delay passed");
		} else {
			fail("Process payment returned unexpected data", { message: JSON.stringify(res.data) });
		}
	} catch (err) {
		fail("POST /process-payment failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testTransactions() {
	log("🔵", "=== 15. GET /transactions ===");
	try {
		const res = await axios.get(`${BASE}/transactions`, { headers: headers() });
		const txns = res.data.data?.transactions;
		if (Array.isArray(txns)) {
			pass(`Listed ${txns.length} transaction(s)`);
			txns.forEach((t) => {
				log("   ", `  ${t.type} | ${t.status} | ${t.payment_amount || t.payout_amount || "—"} ${t.payment_currency || t.payout_currency || ""}`);
			});
		}
	} catch (err) {
		fail("GET /transactions failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testCancelLink() {
	log("🔵", "=== 16. Cancel payment link ===");
	// Create a new link to cancel (the first one is already 'used')
	try {
		const createRes = await axios.post(
			`${BASE}/links`,
			{
				name: "Cancel Test",
				amount: 0.001,
				currency: "BTC",
				description: "Link to be cancelled",
			},
			{ headers: headers() }
		);
		const newLinkId = createRes.data.data?.link?.id;
		if (!newLinkId) {
			fail("Could not create link to cancel");
			return;
		}

		const res = await axios.put(`${BASE}/links/${newLinkId}/cancel`, {}, { headers: headers() });
		if (res.data.message?.includes("cancelled")) {
			pass(`Link id=${newLinkId} cancelled`);
		}
	} catch (err) {
		fail("Cancel link failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testEditName() {
	log("🔵", "=== 17. PUT /account/name ===");
	try {
		const res = await axios.put(
			`${BASE}/account/name`,
			{ name: "Updated Test User" },
			{ headers: headers() }
		);
		if (res.data.data?.name === "Updated Test User") {
			pass("Name updated successfully");
		}
	} catch (err) {
		fail("Edit name failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function testValidationErrors() {
	log("🔵", "=== 18. Validation error handling ===");
	try {
		// Try adding address with invalid currency
		await axios.put(
			`${BASE}/account/crypto-address`,
			{ currency: "FAKECOIN", network: "Fake", address: "abc123", label: "test" },
			{ headers: headers() }
		);
		fail("Should have rejected invalid currency");
	} catch (err) {
		if (err.response?.status === 400) {
			pass("Correctly rejected invalid currency (400)");
		} else {
			fail("Unexpected error on validation", err);
		}
	}

	try {
		// Try deleting non-existent address
		await axios.delete(`${BASE}/account/crypto-address/999999`, { headers: headers() });
		fail("Should have returned 404");
	} catch (err) {
		if (err.response?.status === 404) {
			pass("Correctly rejected delete of non-existent address (404)");
		} else {
			fail("Unexpected error on delete validation", err);
		}
	}
}

// ────────────────────────────────────────────────────────────────
async function testMockDashboard() {
	log("🔵", "=== 19. Mock server dashboard ===");
	try {
		const res = await axios.get(`${MOCK_BASE}/dashboard`);
		if (res.status === 200 && res.data.includes("Triple-A Mock Server")) {
			pass("Mock dashboard accessible and showing data");
		}
	} catch (err) {
		fail("Mock dashboard failed", err);
	}
}

// ────────────────────────────────────────────────────────────────
async function cleanup() {
	log("🔵", "=== 20. Cleanup test user ===");
	try {
		const mysql = require("mysql2/promise");
		const conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
		});
		await conn.query("DELETE FROM users WHERE email = ?", [TEST_USER.email]);
		pass(`Test user ${TEST_USER.email} cleaned up`);
		await conn.end();
	} catch (err) {
		fail("Cleanup failed", err);
	}
}

// ════════════════════════════════════════════════════════════════
async function runAllTests() {
	console.log("");
	console.log("╔══════════════════════════════════════════════╗");
	console.log("║    🧪 Full End-to-End Test Suite             ║");
	console.log("╚══════════════════════════════════════════════╝");
	console.log("");

	const startTime = Date.now();

	try {
		await testMockServerHealth();
		await testBackendHealth();
		await testSignup();
		await testVerifyEmail();
		await testLogin();
		await testGetProfile();
		await testAddCryptoAddress();
		await testAddSecondAddress();
		await testUpsertAddress();
		await testDeleteAddress();
		await testCreatePaymentLink();
		await testGetPaymentLinks();
		await testGetPublicLink();
		await testProcessPayment();
		await testTransactions();
		await testCancelLink();
		await testEditName();
		await testValidationErrors();
		await testMockDashboard();
	} catch (err) {
		log("🛑", `FATAL: ${err.message}`);
	}

	await cleanup();

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	console.log("");
	console.log(`⏱  Done in ${elapsed}s`);
	console.log("");
	process.exit(0);
}

runAllTests();
