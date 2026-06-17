const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Enquiry = require('../models/Enquiry');
const router  = express.Router();

// GET /api/analytics/dashboard
// Single aggregated endpoint — no more fetching ALL orders/products on the client
router.get('/dashboard', protect, async (req, res) => {
  try {
    const now      = new Date();
    const thisMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Run all queries in parallel
    const [
      totalOrders,
      pendingOrders,
      thisMonthOrders,
      lastMonthOrders,
      revenueAgg,
      ordersChart,
      recentOrders,
      totalProducts,
      lowStockProducts,
      topProducts,
      recentEnquiries,
      totalEnquiries,
    ] = await Promise.all([

      // Total orders
      Order.countDocuments(),

      // Pending orders
      Order.countDocuments({ status: 'pending' }),

      // This month's orders for revenue comparison
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Last month's orders for comparison
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Last 6 months revenue for the chart
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            count:   { $sum: 1 },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Orders by status
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Recent orders (last 6, lean for speed)
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),

      // Total active products
      Product.countDocuments({ status: 'active' }),

      // Low-stock count
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, status: 'active' }),

      // Top products (by price as proxy — replace with sales count if order items tracked)
      Product.find({ status: 'active' }).sort({ price: -1 }).limit(5).select('name price unit stock images').lean(),

      // Recent enquiries
      Enquiry.find().sort({ createdAt: -1 }).limit(5).lean(),

      // Total enquiries
      Enquiry.countDocuments(),
    ]);

    // Format revenue chart
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueChart = revenueAgg.map(r => ({
      month:   MONTHS[r._id.month - 1],
      revenue: r.revenue,
      orders:  r.count,
    }));

    // Format orders chart
    const ordersChartFormatted = ordersChart.map(o => ({
      status: o._id,
      count:  o.count,
    }));

    const thisMonthRevenue = thisMonthOrders[0]?.total || 0;
    const lastMonthRevenue = lastMonthOrders[0]?.total || 0;
    const revenueChange = lastMonthRevenue === 0 ? 100
      : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    // Total all-time revenue
    const totalRevenue = revenueAgg.reduce((s, r) => s + r.revenue, 0);

    res.json({
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalEnquiries,
        thisMonthRevenue,
        revenueChange,
      },
      revenueChart,
      ordersChart: ordersChartFormatted,
      recentOrders,
      topProducts,
      recentEnquiries,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
