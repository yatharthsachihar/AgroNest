const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Admin   = require('../models/Admin');
const router  = express.Router();

const sign = (id) =>
  jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Normalize an Admin document into the same shape as User.toPublic()
const adminToPublicUser = (admin) => ({
  _id:             admin._id,
  fullName:        admin.name,
  email:           admin.email,
  mobile:          admin.mobile || '',
  accountType:     'admin',
  role:            admin.role,
  state:           '',
  district:        '',
  city:            '',
  isActive:        admin.isActive,
  isEmailVerified: true,
  avatar:          '',
  wishlist:        [],
  isAdminAccount:  true,
});

/* ─────────────────────────────────────────
   POST /api/users/register
───────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { fullName, mobile, email, password, accountType, state, district, city } = req.body;

    // Validate required fields
    if (!fullName || !mobile || !email || !password)
      return res.status(400).json({ message: 'Please fill all required fields.' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    // Duplicate check
    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Mobile number';
      return res.status(409).json({ message: `${field} is already registered.` });
    }

    const user = await User.create({
      fullName, mobile, email, password,
      accountType: accountType || 'retail_customer',
      state:    state    || '',
      district: district || '',
      city:     city     || '',
    });

    const token = sign(user._id);
    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    console.error('[Register]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   POST /api/users/login
───────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ message: 'Email/mobile and password are required.' });

    // Try the User collection first
    const user = await User.findOne({
      $or: [
        { email:  identifier.toLowerCase() },
        { mobile: identifier },
      ],
    });

    if (user) {
      if (!(await user.matchPassword(password)))
        return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
      if (!user.isActive)
        return res.status(403).json({ message: 'Your account has been deactivated. Contact support.' });

      const token = sign(user._id);
      return res.json({ token, user: user.toPublic() });
    }

    // Fallback: allow Admin accounts to log in as site users too
    const admin = await Admin.findOne({ email: identifier.toLowerCase() });
    if (admin && (await admin.matchPassword(password))) {
      if (!admin.isActive)
        return res.status(403).json({ message: 'Your account has been deactivated. Contact support.' });

      const token = sign(admin._id);
      return res.json({ token, user: adminToPublicUser(admin) });
    }

    return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
  } catch (err) {
    console.error('[Login]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   GET /api/users/status   — quick check
───────────────────────────────────────── */
router.get('/status', require('../middleware/userAuthMiddleware').protectUser, (req, res) => {
  res.json({ isActive: req.user.isActive });
});

/* ─────────────────────────────────────────
   GET /api/users/me   — protected
───────────────────────────────────────── */
router.get('/me', require('../middleware/userAuthMiddleware').protectUser, (req, res) => {
  res.json(req.user);
});

/* ─────────────────────────────────────────
   PUT /api/users/me   — update profile
───────────────────────────────────────── */
router.put('/me', require('../middleware/userAuthMiddleware').protectUser, async (req, res) => {
  try {
    const allowed = ['fullName', 'mobile', 'state', 'district', 'city', 'avatar', 'accountType'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/me — self-deactivate own account
router.delete('/me', require('../middleware/userAuthMiddleware').protectUser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ message: 'Your account has been deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const { protect } = require('../middleware/authMiddleware');

// GET /api/users - Get all users (Admin only)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id - Get single user details (Admin only)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id - Update user status/details (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { isActive, accountType, fullName, email, mobile } = req.body;
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (accountType !== undefined) updates.accountType = accountType;
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (mobile !== undefined) updates.mobile = mobile;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id - Soft-deactivate user account (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User account deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
