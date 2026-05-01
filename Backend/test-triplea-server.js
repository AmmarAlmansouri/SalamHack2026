// test-triplea-server.js
// Mock Triple-A API server for local development and testing.
// Simulates payment creation, payment status, payout preparation,
// payout confirmation, payout status, and fires webhooks back
// to the main backend server.
//
// Usage:
//   node test-triplea-server.js
//
// Then set TRIPLEA_BASE_URL=http://localhost:4000/v1 in your .env

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = 4000;

// ── In-memory stores ────────────────────────────────────────────
const payments = new Map(); // payment_id → payment object
const payouts = new Map(); // payout_id → payout object

// ── Config ──────────────────────────────────────────────────────
// The secret must match TRIPLEA_API_SECRET in your .env so
// webhook signature verification passes on the main backend.
const API_SECRET = process.env.TRIPLEA_API_SECRET || "your_triplea_api_secret";
// Where to fire webhooks — should be your backend's APP_URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
// Delay (ms) before firing the "paid" webhook after payment creation
const PAYMENT_WEBHOOK_DELAY = parseInt(
  process.env.PAYMENT_WEBHOOK_DELAY || "5000",
  10,
);
// Delay (ms) before firing the "completed" webhook after payout confirmation
const PAYOUT_WEBHOOK_DELAY = parseInt(
  process.env.PAYOUT_WEBHOOK_DELAY || "3000",
  10,
);

// ── Helpers ─────────────────────────────────────────────────────
function generateId(prefix = "pay") {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", API_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

function log(emoji, msg, data) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`${emoji}  [${ts}] ${msg}`);
  if (data)
    console.log(
      "   ",
      JSON.stringify(data, null, 2).split("\n").join("\n    "),
    );
}

async function fireWebhook(url, payload) {
  const signature = signPayload(payload);
  try {
    log("📤", `Firing webhook → ${url}`, payload);
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-signature": signature,
      },
      timeout: 10000,
    });
    log("✅", `Webhook accepted (${res.status})`, res.data);
  } catch (err) {
    log("❌", `Webhook failed: ${err.message}`);
    if (err.response) {
      log("❌", `  Response: ${err.response.status}`, err.response.data);
    }
  }
}

// ── Middleware: log all requests ─────────────────────────────────
app.use((req, res, next) => {
  log("🔵", `${req.method} ${req.path}`);
  next();
});

// ══════════════════════════════════════════════════════════════════
// POST /v1/payment — Create a payment
// ══════════════════════════════════════════════════════════════════
app.post("/v1/payment", (req, res) => {
  const {
    merchant_id,
    order_id,
    amount,
    currency,
    customer,
    notification,
    metadata,
  } = req.body;

  const paymentId = generateId("pay");
  const hostedUrl = `http://localhost:${PORT}/hosted/${paymentId}`;

  const payment = {
    payment_id: paymentId,
    merchant_id,
    order_id,
    amount,
    currency,
    customer,
    status: "new",
    hosted_url: hostedUrl,
    notification,
    metadata,
    created_at: new Date().toISOString(),
  };

  payments.set(paymentId, payment);
  log("💳", `Payment created: ${paymentId}`, { order_id, amount, currency });

  // Auto-trigger "paid" webhook after a delay to simulate customer paying
  if (notification?.webhook_url) {
    setTimeout(async () => {
      payment.status = "paid";
      payment.paid_at = new Date().toISOString();
      log("💰", `Payment ${paymentId} auto-marked as PAID`);

      await fireWebhook(notification.webhook_url, {
        payment_id: paymentId,
        status: "paid",
        amount: parseFloat(amount),
        currency,
        order_id,
        metadata,
        paid_at: payment.paid_at,
      });
    }, PAYMENT_WEBHOOK_DELAY);
  }

  res.status(201).json({
    payment_id: paymentId,
    hosted_url: hostedUrl,
    status: "new",
    amount,
    currency,
  });
});

// ══════════════════════════════════════════════════════════════════
// GET /v1/payment/:paymentId — Get payment status
// ══════════════════════════════════════════════════════════════════
app.get("/v1/payment/:paymentId", (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }
  log("🔍", `Payment status: ${payment.payment_id} → ${payment.status}`);
  res.json(payment);
});

// ══════════════════════════════════════════════════════════════════
// POST /v1/payout — Prepare a payout
// ══════════════════════════════════════════════════════════════════
app.post("/v1/payout", (req, res) => {
  const {
    merchant_id,
    payout_id,
    amount,
    currency,
    network,
    recipient,
    notification,
    metadata,
  } = req.body;

  const internalPayoutId = payout_id || generateId("pout");

  const payout = {
    payout_id: internalPayoutId,
    merchant_id,
    amount,
    currency,
    network,
    recipient,
    status: "prepared",
    notification,
    metadata,
    created_at: new Date().toISOString(),
  };

  payouts.set(internalPayoutId, payout);
  log("📦", `Payout prepared: ${internalPayoutId}`, {
    amount,
    currency,
    network,
    address: recipient?.address,
  });

  res.status(201).json({
    payout_id: internalPayoutId,
    status: "prepared",
    amount,
    currency,
    network,
  });
});

// ══════════════════════════════════════════════════════════════════
// POST /v1/payout/:payoutId/confirm — Confirm a payout
// ══════════════════════════════════════════════════════════════════
app.post("/v1/payout/:payoutId/confirm", (req, res) => {
  const payout = payouts.get(req.params.payoutId);
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }

  payout.status = "processing";
  log("✏️", `Payout ${payout.payout_id} confirmed → processing`);

  // Auto-trigger "completed" webhook after a delay
  if (payout.notification?.webhook_url) {
    const fakeTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    setTimeout(async () => {
      payout.status = "completed";
      payout.tx_hash = fakeTxHash;
      payout.completed_at = new Date().toISOString();
      log("🎉", `Payout ${payout.payout_id} auto-marked as COMPLETED`);

      await fireWebhook(payout.notification.webhook_url, {
        payout_id: payout.payout_id,
        status: "completed",
        tx_hash: fakeTxHash,
        amount: payout.amount,
        currency: payout.currency,
        completed_at: payout.completed_at,
      });
    }, PAYOUT_WEBHOOK_DELAY);
  }

  res.json({
    payout_id: payout.payout_id,
    status: "processing",
  });
});

// ══════════════════════════════════════════════════════════════════
// GET /v1/payout/:payoutId — Get payout status
// ══════════════════════════════════════════════════════════════════
app.get("/v1/payout/:payoutId", (req, res) => {
  const payout = payouts.get(req.params.payoutId);
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }
  log("🔍", `Payout status: ${payout.payout_id} → ${payout.status}`);
  res.json(payout);
});

// ══════════════════════════════════════════════════════════════════
// GET /hosted/:paymentId — Simulated hosted payment page
// ══════════════════════════════════════════════════════════════════
app.get("/hosted/:paymentId", (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).send("<h1>Payment not found</h1>");
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Payment — ${payment.payment_id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      background: #0f0f23; color: #e0e0e0;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh;
    }
    .card {
      background: linear-gradient(135deg, #1a1a3e 0%, #16213e 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 40px;
      max-width: 440px; width: 100%;
      box-shadow: 0 24px 48px rgba(0,0,0,0.4);
    }
    .badge { 
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 16px;
    }
    .badge.test { background: #ff6b3520; color: #ff6b35; border: 1px solid #ff6b3540; }
    .badge.status { background: #00d4aa20; color: #00d4aa; border: 1px solid #00d4aa40; }
    h1 { font-size: 22px; margin-bottom: 24px; color: #fff; }
    .detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .detail .label { color: #888; font-size: 14px; }
    .detail .value { color: #fff; font-weight: 500; font-size: 14px; }
    .amount-row .value { font-size: 20px; color: #00d4aa; font-weight: 700; }
    .actions { margin-top: 28px; display: flex; gap: 12px; }
    .btn {
      flex: 1; padding: 14px; border: none; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      transition: transform 0.1s, opacity 0.2s;
    }
    .btn:hover { transform: scale(1.02); }
    .btn:active { transform: scale(0.98); }
    .btn.pay { background: linear-gradient(135deg, #00d4aa, #00b894); color: #000; }
    .btn.fail { background: rgba(255,255,255,0.06); color: #888; border: 1px solid rgba(255,255,255,0.1); }
    .btn.pay:hover { opacity: 0.9; }
    .msg { margin-top: 20px; text-align: center; font-size: 13px; color: #666; }
    .result { margin-top: 20px; padding: 16px; border-radius: 10px; text-align: center; font-weight: 600; display: none; }
    .result.success { background: #00d4aa20; color: #00d4aa; border: 1px solid #00d4aa40; display: block; }
    .result.error { background: #ff6b3520; color: #ff6b35; border: 1px solid #ff6b3540; display: block; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge test">⚡ Test Mode</span>
    <span class="badge status" id="status-badge">${payment.status}</span>
    <h1>Crypto Payment</h1>
    <div class="detail amount-row">
      <span class="label">Amount</span>
      <span class="value">${payment.amount}$</span>
    </div>
    <div class="detail">
      <span class="label">Order</span>
      <span class="value">${payment.order_id}</span>
    </div>
    <div class="detail">
      <span class="label">Customer</span>
      <span class="value">${payment.customer?.name || "—"}</span>
    </div>
    <div class="detail">
      <span class="label">Payment ID</span>
      <span class="value" style="font-size:12px;font-family:monospace">${payment.payment_id}</span>
    </div>

    <div class="actions" id="actions">
      <button class="btn pay" onclick="simulateAction('pay')">✓ Simulate Pay</button>
      <button class="btn fail" onclick="simulateAction('fail')">✗ Simulate Fail</button>
    </div>

    <div id="result"></div>

    <p class="msg">This is a <strong>test</strong> payment page. No real funds are involved.</p>
  </div>

  <script>
    async function simulateAction(action) {
      const btn = document.querySelectorAll('.btn');
      btn.forEach(b => b.disabled = true);

      try {
        const res = await fetch('/simulate/payment/${payment.payment_id}/' + action, { method: 'POST' });
        const data = await res.json();
        
        const result = document.getElementById('result');
        const badge = document.getElementById('status-badge');
        const actions = document.getElementById('actions');
        
        if (action === 'pay') {
          result.className = 'result success';
          result.textContent = '✓ Payment successful! Webhook fired.';
          result.style.display = 'block';
          badge.textContent = 'paid';
        } else {
          result.className = 'result error';
          result.textContent = '✗ Payment failed. Webhook fired.';
          result.style.display = 'block';
          badge.textContent = 'failed';
        }
        actions.style.display = 'none';

        // Redirect after a short delay if redirect URL exists
        ${
          payment.notification?.redirect_url
            ? `
        if (action === 'pay') {
          setTimeout(() => { window.location.href = '${payment.notification.redirect_url}'; }, 2000);
        }`
            : ""
        }
        ${
          payment.notification?.cancel_url
            ? `
        if (action === 'fail') {
          setTimeout(() => { window.location.href = '${payment.notification.cancel_url}'; }, 2000);
        }`
            : ""
        }
      } catch (err) {
        alert('Error: ' + err.message);
        btn.forEach(b => b.disabled = false);
      }
    }
  </script>
</body>
</html>
  `);
});

// ══════════════════════════════════════════════════════════════════
// POST /simulate/payment/:paymentId/:action — Manual trigger
// Allows the hosted page (or curl) to trigger "pay" or "fail"
// ══════════════════════════════════════════════════════════════════
app.post("/simulate/payment/:paymentId/:action", async (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const action = req.params.action; // "pay" or "fail"

  if (action === "pay") {
    payment.status = "paid";
    payment.paid_at = new Date().toISOString();
    log("💰", `Payment ${payment.payment_id} manually marked as PAID`);

    if (payment.notification?.webhook_url) {
      await fireWebhook(payment.notification.webhook_url, {
        payment_id: payment.payment_id,
        status: "paid",
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        order_id: payment.order_id,
        metadata: payment.metadata,
        paid_at: payment.paid_at,
      });
    }
  } else if (action === "fail") {
    payment.status = "failed";
    payment.failed_at = new Date().toISOString();
    log("💥", `Payment ${payment.payment_id} manually marked as FAILED`);

    if (payment.notification?.webhook_url) {
      await fireWebhook(payment.notification.webhook_url, {
        payment_id: payment.payment_id,
        status: "failed",
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        order_id: payment.order_id,
        metadata: payment.metadata,
        failed_at: payment.failed_at,
      });
    }
  } else {
    return res
      .status(400)
      .json({ error: "Invalid action. Use 'pay' or 'fail'" });
  }

  res.json({ status: payment.status, payment_id: payment.payment_id });
});

// ══════════════════════════════════════════════════════════════════
// POST /simulate/payout/:payoutId/:action — Manual payout trigger
// ══════════════════════════════════════════════════════════════════
app.post("/simulate/payout/:payoutId/:action", async (req, res) => {
  const payout = payouts.get(req.params.payoutId);
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }

  const action = req.params.action; // "complete" or "fail"

  if (action === "complete") {
    const fakeTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
    payout.status = "completed";
    payout.tx_hash = fakeTxHash;
    payout.completed_at = new Date().toISOString();
    log("🎉", `Payout ${payout.payout_id} manually marked as COMPLETED`);

    if (payout.notification?.webhook_url) {
      await fireWebhook(payout.notification.webhook_url, {
        payout_id: payout.payout_id,
        status: "completed",
        tx_hash: fakeTxHash,
        amount: payout.amount,
        currency: payout.currency,
        completed_at: payout.completed_at,
      });
    }
  } else if (action === "fail") {
    payout.status = "failed";
    payout.failed_at = new Date().toISOString();
    log("💥", `Payout ${payout.payout_id} manually marked as FAILED`);

    if (payout.notification?.webhook_url) {
      await fireWebhook(payout.notification.webhook_url, {
        payout_id: payout.payout_id,
        status: "failed",
        amount: payout.amount,
        currency: payout.currency,
        failed_at: payout.failed_at,
      });
    }
  } else {
    return res
      .status(400)
      .json({ error: "Invalid action. Use 'complete' or 'fail'" });
  }

  res.json({ status: payout.status, payout_id: payout.payout_id });
});

// ══════════════════════════════════════════════════════════════════
// GET /dashboard — Admin view of all payments & payouts
// ══════════════════════════════════════════════════════════════════
app.get("/dashboard", (req, res) => {
  const allPayments = Array.from(payments.values());
  const allPayouts = Array.from(payouts.values());

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Triple-A Mock Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0a0a1a; color: #ccc; padding: 32px; }
    h1 { color: #fff; margin-bottom: 8px; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; }
    h2 { color: #aaa; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin: 28px 0 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px 14px; background: #1a1a2e; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 14px; border-bottom: 1px solid #1a1a2e; font-size: 13px; }
    .status { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status.new { background: #3b82f620; color: #60a5fa; }
    .status.paid { background: #00d4aa20; color: #00d4aa; }
    .status.prepared { background: #f59e0b20; color: #f59e0b; }
    .status.processing { background: #8b5cf620; color: #a78bfa; }
    .status.completed { background: #00d4aa20; color: #00d4aa; }
    .status.failed { background: #ef444420; color: #f87171; }
    .empty { color: #555; padding: 20px; text-align: center; font-style: italic; }
    .mono { font-family: 'SF Mono', monospace; font-size: 11px; color: #888; }
    .refresh { color: #60a5fa; cursor: pointer; text-decoration: underline; font-size: 13px; }
    .refresh:hover { color: #93bbfc; }
  </style>
</head>
<body>
  <h1>⚡ Triple-A Mock Server</h1>
  <p class="subtitle">Port ${PORT} — <a class="refresh" href="/dashboard">Refresh</a></p>

  <h2>Payments (${allPayments.length})</h2>
  ${
    allPayments.length === 0
      ? '<p class="empty">No payments yet. Create a payment link and process it.</p>'
      : `
  <table>
    <tr><th>Payment ID</th><th>Order</th><th>Amount</th><th>Currency</th><th>Customer</th><th>Status</th><th>Created</th></tr>
    ${allPayments
      .map(
        (p) => `
    <tr>
      <td class="mono">${p.payment_id}</td>
      <td>${p.order_id || "—"}</td>
      <td>${p.amount}</td>
      <td>${p.currency}</td>
      <td>${p.customer?.name || "—"}</td>
      <td><span class="status ${p.status}">${p.status}</span></td>
      <td class="mono">${p.created_at?.slice(11, 19) || "—"}</td>
    </tr>`,
      )
      .join("")}
  </table>`
  }

  <h2>Payouts (${allPayouts.length})</h2>
  ${
    allPayouts.length === 0
      ? '<p class="empty">No payouts yet. Payouts are created when a payment webhook is processed.</p>'
      : `
  <table>
    <tr><th>Payout ID</th><th>Amount</th><th>Currency</th><th>Network</th><th>Recipient</th><th>Status</th><th>Created</th></tr>
    ${allPayouts
      .map(
        (p) => `
    <tr>
      <td class="mono">${p.payout_id}</td>
      <td>${p.amount}</td>
      <td>${p.currency}</td>
      <td>${p.network || "—"}</td>
      <td class="mono">${p.recipient?.address?.slice(0, 20) || "—"}…</td>
      <td><span class="status ${p.status}">${p.status}</span></td>
      <td class="mono">${p.created_at?.slice(11, 19) || "—"}</td>
    </tr>`,
      )
      .join("")}
  </table>`
  }

  <script>setTimeout(() => location.reload(), 5000);</script>
</body>
</html>
  `);
});

// ══════════════════════════════════════════════════════════════════
// Start server
// ══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log("");
  console.log("  ⚡ Triple-A Mock Server running on port " + PORT);
  console.log("");
  console.log("  Endpoints:");
  console.log("    POST /v1/payment              — Create payment");
  console.log("    GET  /v1/payment/:id           — Get payment status");
  console.log("    POST /v1/payout                — Prepare payout");
  console.log("    POST /v1/payout/:id/confirm     — Confirm payout");
  console.log("    GET  /v1/payout/:id             — Get payout status");
  console.log("");
  console.log("  Simulate:");
  console.log("    POST /simulate/payment/:id/pay   — Trigger paid webhook");
  console.log("    POST /simulate/payment/:id/fail  — Trigger failed webhook");
  console.log(
    "    POST /simulate/payout/:id/complete — Trigger completed webhook",
  );
  console.log("    POST /simulate/payout/:id/fail    — Trigger failed webhook");
  console.log("");
  console.log("  Dashboard:  http://localhost:" + PORT + "/dashboard");
  console.log("  Hosted pay: http://localhost:" + PORT + "/hosted/:paymentId");
  console.log("");
  console.log("  Config:");
  console.log("    API_SECRET:            " + API_SECRET.slice(0, 8) + "...");
  console.log("    BACKEND_URL:           " + BACKEND_URL);
  console.log("    PAYMENT_WEBHOOK_DELAY: " + PAYMENT_WEBHOOK_DELAY + "ms");
  console.log("    PAYOUT_WEBHOOK_DELAY:  " + PAYOUT_WEBHOOK_DELAY + "ms");
  console.log("");
  console.log(
    "  👉 Set TRIPLEA_BASE_URL=http://localhost:" + PORT + "/v1 in your .env",
  );
  console.log("");
});
