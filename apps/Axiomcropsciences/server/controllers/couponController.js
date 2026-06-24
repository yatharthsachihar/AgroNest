const Coupon = require('../models/Coupon');

exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      isActive: true, 
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] 
    }).sort({ minOrderAmount: 1 });
    res.json(coupons);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: 'Coupon expired' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (orderAmount < coupon.minOrderAmount)
      return res.status(400).json({ message: `Minimum order ₹${coupon.minOrderAmount} required` });
    res.json(coupon);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
