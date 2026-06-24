const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

const router = express.Router();

router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

router.get('/', protect, getAllCoupons);
router.post('/', protect, createCoupon);
router.put('/:id', protect, updateCoupon);
router.delete('/:id', protect, deleteCoupon);

module.exports = router;
