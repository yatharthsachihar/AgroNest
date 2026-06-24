const ActivityLog = require('../models/ActivityLog');

// Maps URL patterns → human-readable resource names + summary templates
const RESOURCE_MAP = [
  { pattern: /\/api\/products/,   resource: 'product',  noun: 'Product'   },
  { pattern: /\/api\/categories/, resource: 'category', noun: 'Category'  },
  { pattern: /\/api\/orders/,     resource: 'order',    noun: 'Order'     },
  { pattern: /\/api\/enquiries/,  resource: 'enquiry',  noun: 'Enquiry'   },
  { pattern: /\/api\/banners/,    resource: 'banner',   noun: 'Banner'    },
  { pattern: /\/api\/blogs/,      resource: 'blog',     noun: 'Blog Post' },
  { pattern: /\/api\/pages/,      resource: 'page',     noun: 'Page'      },
  { pattern: /\/api\/media/,      resource: 'media',    noun: 'Media'     },
  { pattern: /\/api\/coupons/,    resource: 'coupon',   noun: 'Coupon'    },
  { pattern: /\/api\/settings/,   resource: 'settings', noun: 'Settings'  },
  { pattern: /\/api\/users/,      resource: 'user',     noun: 'User'      },
  { pattern: /\/api\/auth/,       resource: 'auth',     noun: 'Auth'      },
];

const ACTION_MAP = {
  POST:   'Created',
  PUT:    'Updated',
  PATCH:  'Updated',
  DELETE: 'Deleted',
  GET:    'Viewed',
};

function detectResource(url) {
  const match = RESOURCE_MAP.find(r => r.pattern.test(url));
  return match || { resource: 'system', noun: 'Record' };
}

function buildSummary(method, noun, body, url) {
  const action = ACTION_MAP[method] || method;
  // Try to get a meaningful name from request body
  const name = body?.name || body?.title || body?.fullName || body?.storeName || '';
  // Extract id from URL if present
  const idMatch = url.match(/\/([a-f0-9]{24})(?:\/|$)/i);
  const shortId = idMatch ? `#${idMatch[1].slice(-6).toUpperCase()}` : '';

  if (name) return `${action} ${noun}: "${name}"`;
  if (shortId) return `${action} ${noun} ${shortId}`;
  if (method === 'POST' && url.includes('upload')) return `Uploaded media file`;
  if (url.includes('/login')) return `Admin logged in`;
  return `${action} ${noun}`;
}

/**
 * activityLogger middleware
 *
 * Attach AFTER auth middleware (protect) on admin routes so req.admin is populated.
 * Intercepts the response to capture status code, then writes to ActivityLog.
 *
 * Usage in index.js:
 *   const { activityLogger } = require('./middleware/activityLogger');
 *   app.use('/api', activityLogger);  // logs all /api/* mutations
 */
const activityLogger = (req, res, next) => {
  // Only log mutating methods — skip GETs to keep log readable
  const LOGGED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!LOGGED_METHODS.includes(req.method)) return next();

  // Intercept res.json so we can capture the status code after the handler runs
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Run after handler sets status
    const statusCode = res.statusCode || 200;

    // Only log successful operations (2xx)
    if (statusCode >= 200 && statusCode < 300) {
      const { resource, noun } = detectResource(req.url);
      const summary = buildSummary(req.method, noun, req.body, req.url);

      // Extract _id from response body if present (e.g. newly created doc)
      const targetId = (typeof body === 'object' && body !== null)
        ? (body._id?.toString() || body.id?.toString() || '')
        : '';

      // req.admin is set by protect middleware; req.user for enquiry submissions from site
      const admin = req.admin || null;

      ActivityLog.create({
        adminId:    admin?._id || null,
        adminName:  admin?.name || 'System',
        adminRole:  admin?.role || 'system',
        method:     req.method,
        url:        req.url,
        resource,
        action:     ACTION_MAP[req.method] || req.method,
        summary,
        targetId,
        statusCode,
        ip:         req.ip || '',
      }).catch(err => {
        // Never crash the request if logging fails
        console.error('[ActivityLog] Failed to write log:', err.message);
      });
    }

    return originalJson(body);
  };

  next();
};

module.exports = { activityLogger };
