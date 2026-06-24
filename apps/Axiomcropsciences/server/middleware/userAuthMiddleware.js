const jwt   = require('jsonwebtoken');
const User  = require('../models/User');
const Admin = require('../models/Admin');

const protectUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== 'user')
      return res.status(403).json({ message: 'Not a user token' });

    let account = await User.findById(decoded.id).select('-password');
    if (account) {
      req.user = account;
      return next();
    }

    // Fallback: token belongs to an Admin acting as a site user
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) return res.status(401).json({ message: 'User not found' });

    req.user = {
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
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { protectUser };
