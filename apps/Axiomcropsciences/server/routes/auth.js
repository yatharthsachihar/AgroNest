const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !(await admin.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: generateToken(admin._id), admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — verify token and return admin info
router.get('/me', protect, (req, res) => {
  res.json(req.admin);
});

// GET /api/auth/users
router.get('/users', protect, async (req, res) => {
  try {
    const users = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/users
router.post('/users', protect, async (req, res) => {
  try {
    const requesterRole = req.admin.role;
    if (requesterRole !== 'super_admin' && requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create admins.' });
    }

    const { name, email, password, role, isActive } = req.body;

    if (requesterRole === 'admin' && role === 'super_admin') {
      return res.status(403).json({ message: 'Admins cannot create super_admin accounts.' });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await Admin.create({ name, email: email.toLowerCase(), password, role, isActive });
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/auth/users/:id
router.put('/users/:id', protect, async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const requesterRole = req.admin.role;
    if (requesterRole !== 'super_admin' && requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage admins.' });
    }

    if (requesterRole === 'admin') {
      if (user.role === 'super_admin') {
        return res.status(403).json({ message: 'Admins cannot modify super_admin accounts.' });
      }
      if (role === 'super_admin') {
        return res.status(403).json({ message: 'Admins cannot set role to super_admin.' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', protect, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const requesterRole = req.admin.role;
    if (requesterRole !== 'super_admin' && requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete admins.' });
    }

    if (requesterRole === 'admin' && user.role === 'super_admin') {
      return res.status(403).json({ message: 'Admins cannot delete super_admin accounts.' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
