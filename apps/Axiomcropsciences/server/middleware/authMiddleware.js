const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const { MODULES } = require('../utils/permissionDefaults');

// Permission levels that allow write (non-GET) operations. 'full' is the
// existing level; 'edit'/'write' are accepted too so a future "can modify but
// not delete"-style tier works without changing this middleware again.
const WRITE_LEVELS = new Set(['full', 'edit', 'write']);

// The editable permission matrix lives on the Settings document under
// `permissionMatrix` (the same place the Roles admin page reads/writes via
// roleRoutes.js). Earlier this middleware read an orphan RolePermission
// collection that nothing ever populated, so enforcement was a silent no-op.
// We read the authoritative source and fall back to the hardcoded defaults.
let _matrixCache = { matrix: null, at: 0 };
const MATRIX_TTL_MS = 30 * 1000;
async function getPermissionMatrix() {
  const now = Date.now();
  if (_matrixCache.matrix && now - _matrixCache.at < MATRIX_TTL_MS) return _matrixCache.matrix;
  const settings = await Settings.findOne().lean();
  const matrix = (settings?.permissionMatrix?.length) ? settings.permissionMatrix : MODULES;
  _matrixCache = { matrix, at: now };
  return matrix;
}

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ message: 'Admin not found, unauthorized' });
    
    // Dynamic RBAC Strict Enforcement
    if (req.admin.role !== 'super_admin' && req.method !== 'GET') {
      const url = req.originalUrl || '';
      let moduleKey = null;
      
      if (url.includes('/banners')) moduleKey = 'banners';
      else if (url.includes('/settings')) moduleKey = 'settings';
      else if (url.includes('/auth/users')) moduleKey = 'users';
      else if (url.includes('/products')) moduleKey = 'products';
      else if (url.includes('/categories')) moduleKey = 'categories';
      else if (url.includes('/orders')) moduleKey = 'orders';
      else if (url.includes('/customers')) moduleKey = 'customers';
      else if (url.includes('/blogs')) moduleKey = 'blog';
      else if (url.includes('/pages')) moduleKey = 'pages';
      else if (url.includes('/coupons')) moduleKey = 'coupons';
      else if (url.includes('/enquiries')) moduleKey = 'enquiries';
      else if (url.includes('/media')) moduleKey = 'media';
      else if (url.includes('/seo')) moduleKey = 'seo';
      else if (url.includes('/website')) moduleKey = 'website_builder';
      else if (url.includes('/theme')) moduleKey = 'theme_builder';
      
      if (moduleKey) {
        const matrix = await getPermissionMatrix();
        const mod = Array.isArray(matrix) && matrix.find(m => m.key === moduleKey);
        if (mod && mod.permissions) {
          const level = mod.permissions[req.admin.role] || 'none';
          if (!WRITE_LEVELS.has(level)) {
            return res.status(403).json({ message: 'Read-only mode. Your role lacks write access to modify this module.' });
          }
        }
      }
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Lets the roles route clear the cache the moment the matrix is edited, so
// permission changes apply immediately instead of after the TTL window.
function clearPermissionMatrixCache() {
  _matrixCache = { matrix: null, at: 0 };
}

module.exports = { protect, clearPermissionMatrixCache };
