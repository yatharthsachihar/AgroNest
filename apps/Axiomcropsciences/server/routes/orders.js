const express = require('express');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
const sseManager = require('../utils/sse');

const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');

const { protectUser } = require('../middleware/userAuthMiddleware');

// Protected User — place order
router.post('/', protectUser, async (req, res) => {
  try {
    const { items, couponCode, customerName, customerEmail, customerPhone, address, city, state, pincode, paymentMethod } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate the requested payment method against what the admin has
    // actually enabled in Settings. The storefront already hides disabled
    // options from the UI, but that's a client-side convenience only —
    // without this check, anyone could still POST paymentMethod: "COD"
    // directly to the API even after an admin turns COD off.
    const settingsDoc = await Settings.findOne() || {};
    const VALID_METHODS = ['COD', 'Razorpay', 'PhonePe'];

    if (!paymentMethod || !VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const methodEnabled = {
      COD:      settingsDoc.codActive      !== false,
      Razorpay: settingsDoc.razorpayActive  !== false,
      PhonePe:  settingsDoc.phonepeActive   !== false,
    };

    if (!methodEnabled[paymentMethod]) {
      return res.status(400).json({ message: `${paymentMethod} is currently unavailable. Please choose another payment method.` });
    }

    let calculatedTotal = 0;
    const enrichedItems = [];
    
    // 1. Fetch exact product prices from DB
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product ${item.name} not found`);

      // Resolve the variation, if one was purchased. The client may send a
      // variationId (preferred) or just a variationWeight; either lets us pull
      // the authoritative price from the embedded variation rather than the
      // base product. Falls back cleanly to the base price for plain products.
      let variation = null;
      if (product.hasVariations && (item.variationId || item.variationWeight)) {
        variation = product.variations.find(v =>
          (item.variationId && String(v._id) === String(item.variationId)) ||
          (item.variationWeight && v.weight === item.variationWeight)
        );
        if (!variation) throw new Error(`Selected variation for ${product.name} is unavailable`);
      }

      const price = variation ? variation.price : (product.salePrice || product.price);
      calculatedTotal += price * item.quantity;

      enrichedItems.push({
        product: product._id,
        name: variation ? `${product.name} (${variation.weight})` : product.name,
        price: price, // Securely set price from DB
        quantity: item.quantity,
        image: item.image || item.images?.[0] || "",
        variationId: variation ? variation._id : null,
        variationWeight: variation ? variation.weight : "",
      });
    }

    let discountAmount = 0;
    // 2. Validate Coupon and calculate discount securely
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon) throw new Error('Invalid coupon code');
      if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error('Coupon expired');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
      if (calculatedTotal < coupon.minOrderAmount) throw new Error(`Minimum order ₹${coupon.minOrderAmount} required`);
      
      if (coupon.type === 'percentage') {
        discountAmount = (calculatedTotal * coupon.value) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.value;
      }

      // Increment usedCount
      coupon.usedCount += 1;
      await coupon.save();
    }

    // 3. Apply Shipping rules
    const freeShipping = settingsDoc.freeShippingAbove || 999;
    const subtotalAfterDiscount = calculatedTotal - discountAmount;
    const shipping = subtotalAfterDiscount >= freeShipping ? 0 : 79;
    
    const grandTotal = subtotalAfterDiscount + shipping;

    // 4. Create Order
    const order = await Order.create({
      customerName, customerEmail, customerPhone, address, city, state, pincode, paymentMethod,
      items: enrichedItems,
      totalAmount: grandTotal,
      couponCode: discountAmount > 0 ? couponCode : null,
      discountAmount: discountAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // 5. Deduct Inventory
    for (const item of enrichedItems) {
      const p = await Product.findById(item.product);
      if (p && p.trackInventory) {
        // Deduct from the specific variation when the item was a variation,
        // otherwise from the base product stock. This keeps variation stock
        // accurate instead of always draining the base counter.
        let remaining;
        if (item.variationId) {
          const variation = p.variations.id(item.variationId);
          if (variation) {
            variation.stock -= item.quantity;
            remaining = variation.stock;
          }
        } else {
          p.stock -= item.quantity;
          remaining = p.stock;
        }
        await p.save();

        // Stock alert logic
        if (remaining === 0) {
          sseManager.dispatch({
            type: 'inventory', title: 'Out of Stock',
            message: `${item.name} is now out of stock.`,
            referenceId: p._id, referenceType: 'Product'
          });
        } else if (remaining !== undefined && remaining <= p.lowStockThreshold) {
          sseManager.dispatch({
            type: 'inventory', title: 'Low Stock Alert',
            message: `${item.name} has dropped to ${remaining} units.`,
            referenceId: p._id, referenceType: 'Product'
          });
        }
      }
    }
    
    // Dispatch new order notification
    sseManager.dispatch({
      type: 'order',
      title: 'New Order Received',
      message: `Order #${order._id.toString().slice(-4)} worth ₹${grandTotal} placed by ${customerName}.`,
      referenceId: order._id,
      referenceType: 'Order'
    });

    res.status(201).json(order);
  } catch (err) { 
    console.error('Order creation error:', err);
    res.status(400).json({ message: err.message }); 
  }
});

// Protected User — get their orders
router.get('/my-orders', protectUser, async (req, res) => {
  try {
    // Match on email, and on phone only when the account actually has one —
    // otherwise an empty mobile would match every order with a blank phone.
    const orConditions = [{ customerEmail: req.user.email }];
    if (req.user.mobile) orConditions.push({ customerPhone: req.user.mobile });

    const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Protected User — cancel their pending order
router.put('/:id/cancel', protectUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if the order belongs to this user
    const isOwner = (order.customerEmail === req.user.email) ||
                    (req.user.mobile && order.customerPhone === req.user.mobile);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore inventory that was deducted when the order was placed, mirroring
    // the deduction logic (variation-aware). Without this, cancelled orders
    // would permanently leak stock.
    for (const item of order.items) {
      const p = await Product.findById(item.product);
      if (p && p.trackInventory) {
        if (item.variationId) {
          const variation = p.variations.id(item.variationId);
          if (variation) variation.stock += item.quantity;
        } else {
          p.stock += item.quantity;
        }
        await p.save();
      }
    }

    // Dispatch cancellation notification
    sseManager.dispatch({
      type: 'order',
      title: 'Order Cancelled',
      message: `Order #${order._id.toString().slice(-4)} was cancelled by the customer.`,
      referenceId: order._id,
      referenceType: 'Order'
    });

    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Public — get single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Protected User — confirm payment and mark order as confirmed and paid
router.put('/:id/pay', protectUser, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the customer who placed the order may confirm its payment, so an
    // attacker can't flip an arbitrary order id to "paid".
    const isOwner = (order.customerEmail === req.user.email) ||
                    (req.user.mobile && order.customerPhone === req.user.mobile);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized to confirm payment for this order' });
    }

    order.status = 'confirmed';
    order.paymentStatus = 'paid';
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (transactionId) order.transactionId = transactionId;

    await order.save();

    sseManager.dispatch({
      type: 'payment',
      title: 'Payment Received',
      message: `Order #${order._id.toString().slice(-4)} payment confirmed.`,
      referenceId: order._id,
      referenceType: 'Order'
    });

    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — get all orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — update order status
router.put('/:id', protect, async (req, res) => {
  try {
    // Whitelist the fields an admin may change. Passing req.body verbatim would
    // let any admin rewrite totalAmount, paymentStatus, items, etc.
    const ALLOWED = ['status', 'paymentStatus', 'paymentMethod', 'transactionId'];
    const updates = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.body.status) {
      sseManager.dispatch({
        type: 'order',
        title: 'Order Status Changed',
        message: `Order #${order._id.toString().slice(-4)} marked as ${req.body.status}.`,
        referenceId: order._id,
        referenceType: 'Order'
      });
    }
    
    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — delete order
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
