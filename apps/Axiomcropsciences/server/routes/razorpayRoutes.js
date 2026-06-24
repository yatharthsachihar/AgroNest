/**
 * Razorpay Payment Routes
 *
 * POST /api/razorpay/create-order
 *   → Creates a Razorpay Order on Razorpay's servers.
 *     Returns { rzpOrderId, amount, currency, key } to the client.
 *
 * POST /api/razorpay/verify
 *   → Verifies the HMAC-SHA256 signature returned by Razorpay after payment.
 *     Marks the internal order as paid only if the signature is valid.
 */

const express    = require('express');
const crypto     = require('crypto');
const Razorpay   = require('razorpay');
const Settings   = require('../models/Settings');
const Order      = require('../models/Order');
const sseManager = require('../utils/sse');
const { protectUser } = require('../middleware/userAuthMiddleware');

const router = express.Router();

/* ── Helper: get a live Razorpay instance from DB settings ── */
async function getRazorpay() {
  const s = await Settings.findOne().lean();
  const key_id     = s?.razorpayKey    || process.env.RAZORPAY_KEY_ID;
  const key_secret = s?.razorpaySecret || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || !key_id.startsWith('rzp_')) {
    return null; // no valid keys configured
  }

  return {
    instance: new Razorpay({ key_id, key_secret }),
    key_id,
    key_secret,
    webhookSecret: s?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
  };
}

/* ─────────────────────────────────────────────────────────
   POST /api/razorpay/create-order
   Body: { appOrderId }   (our internal MongoDB order _id)
   ───────────────────────────────────────────────────────── */
router.post('/create-order', protectUser, async (req, res) => {
  try {
    const { appOrderId } = req.body;
    if (!appOrderId) return res.status(400).json({ message: 'appOrderId is required' });

    // Fetch our order from DB to get the authoritative amount
    const order = await Order.findById(appOrderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const rzp = await getRazorpay();

    // No valid Razorpay keys → tell the client to use simulation mode
    if (!rzp) {
      return res.json({
        simulationMode: true,
        amount: order.totalAmount,
        currency: 'INR',
      });
    }

    // Create a Razorpay order (amount in paise)
    const rzpOrder = await rzp.instance.orders.create({
      amount:   Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt:  appOrderId.toString().slice(-20), // Razorpay receipt max 40 chars
      notes:    {
        appOrderId:    appOrderId.toString(),
        customerName:  order.customerName,
        customerEmail: order.customerEmail,
      },
    });

    res.json({
      simulationMode: false,
      rzpOrderId: rzpOrder.id,
      amount:     rzpOrder.amount,      // in paise
      currency:   rzpOrder.currency,
      key:        rzp.key_id,           // safe to expose (public key)
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create Razorpay order' });
  }
});

/* ─────────────────────────────────────────────────────────
   POST /api/razorpay/verify
   Body: { appOrderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
   ───────────────────────────────────────────────────────── */
router.post('/verify', protectUser, async (req, res) => {
  try {
    const { appOrderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!appOrderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment verification fields' });
    }

    const rzp = await getRazorpay();
    if (!rzp) {
      return res.status(500).json({ message: 'Payment gateway not configured' });
    }

    // ── HMAC-SHA256 signature verification ──
    // Razorpay spec: sign = HMAC_SHA256(key_secret, razorpay_order_id + "|" + razorpay_payment_id)
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto
      .createHmac('sha256', rzp.key_secret)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed. Possible tampered request.' });
    }

    // Signature valid — mark order as paid
    const order = await Order.findById(appOrderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = (order.customerEmail === req.user.email) ||
                    (req.user.mobile && order.customerPhone === req.user.mobile);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized to confirm payment for this order' });
    }

    order.paymentStatus  = 'paid';
    order.status         = 'confirmed';
    order.transactionId  = razorpay_payment_id;
    await order.save();

    sseManager.dispatch({
      type: 'payment',
      title: 'Payment Received',
      message: `Order #${order._id.toString().slice(-4)} verified via Razorpay (${razorpay_payment_id}).`,
      referenceId: order._id,
      referenceType: 'Order',
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
});

module.exports = router;
