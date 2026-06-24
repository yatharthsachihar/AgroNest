/**
 * notificationService.js
 * Central service for creating + broadcasting notifications.
 * Import this in any route that needs to fire a notification.
 *
 * Usage:
 *   const notify = require('../services/notificationService');
 *   await notify.order.newOrder(order);
 *   await notify.inventory.lowStock(product);
 */

const sseManager = require('../utils/sse');

// ── Generic dispatcher ─────────────────────────────────────
const dispatch = (type, title, message, referenceId, referenceType) =>
  sseManager.dispatch({ type, title, message, referenceId, referenceType });

// ── Order notifications ────────────────────────────────────
const order = {
  newOrder: (o) => dispatch(
    'order',
    'New Order Received',
    `Order #${String(o._id).slice(-6).toUpperCase()} worth ₹${o.totalAmount?.toLocaleString('en-IN')} placed by ${o.customerName}.`,
    o._id, 'Order'
  ),
  statusChange: (o) => dispatch(
    'order',
    'Order Status Updated',
    `Order #${String(o._id).slice(-6).toUpperCase()} marked as ${o.status}.`,
    o._id, 'Order'
  ),
  cancelled: (o) => dispatch(
    'order',
    'Order Cancelled',
    `Order #${String(o._id).slice(-6).toUpperCase()} was cancelled.`,
    o._id, 'Order'
  ),
  paymentSuccess: (o) => dispatch(
    'payment',
    'Payment Received',
    `Order #${String(o._id).slice(-6).toUpperCase()} payment confirmed via ${o.paymentMethod}.`,
    o._id, 'Order'
  ),
  paymentFailed: (o) => dispatch(
    'payment',
    'Payment Failed',
    `Order #${String(o._id).slice(-6).toUpperCase()} payment was unsuccessful.`,
    o._id, 'Order'
  ),
};

// ── Product notifications ──────────────────────────────────
const product = {
  added: (p) => dispatch(
    'product',
    'New Product Added',
    `${p.name} has been added to the catalog.`,
    p._id, 'Product'
  ),
  updated: (p) => dispatch(
    'product',
    'Product Updated',
    `${p.name} details have been modified.`,
    p._id, 'Product'
  ),
  deleted: (name) => dispatch(
    'product',
    'Product Deleted',
    `${name} has been removed from the catalog.`,
    null, 'Product'
  ),
};

// ── Inventory notifications ────────────────────────────────
const inventory = {
  lowStock: (p) => dispatch(
    'inventory',
    'Low Stock Alert',
    `${p.name} has only ${p.stock} unit${p.stock === 1 ? '' : 's'} left.`,
    p._id, 'Product'
  ),
  outOfStock: (p) => dispatch(
    'inventory',
    'Out of Stock',
    `${p.name} is now out of stock and unavailable to customers.`,
    p._id, 'Product'
  ),
  restocked: (p, oldStock) => dispatch(
    'inventory',
    'Stock Updated',
    `${p.name} stock increased from ${oldStock} to ${p.stock} units.`,
    p._id, 'Product'
  ),
};

// ── Customer notifications ─────────────────────────────────
const customer = {
  registered: (u) => dispatch(
    'customer',
    'New Customer Registered',
    `${u.name || u.email} created an account.`,
    u._id, 'User'
  ),
  loggedIn: (u) => dispatch(
    'customer',
    'Customer Logged In',
    `${u.name || u.email} signed in to their account.`,
    u._id, 'User'
  ),
};

// ── System notifications ───────────────────────────────────
const system = {
  enquiry: (e) => dispatch(
    'system',
    'New Customer Inquiry',
    `${e.name} submitted a${e.type === 'bulk' ? ' bulk order' : ''} contact request.`,
    e._id, 'Enquiry'
  ),
  info: (title, message) => dispatch('system', title, message, null, null),
};

module.exports = { order, product, inventory, customer, system, dispatch };
