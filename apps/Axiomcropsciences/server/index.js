require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

const { activityLogger } = require('./middleware/activityLogger');

const app = express();
connectDB();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global activity logger — intercepts all /api mutations after auth
app.use('/api', activityLogger);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Safe route loader — prevents one bad file from killing the server ──
function mount(app, path, routeFile) {
  try {
    const router = require(routeFile);
    app.use(path, router);
    console.log(`✅ Mounted ${path}`);
  } catch (err) {
    console.error(`❌ Failed to mount ${path}:`, err.message);
  }
}

// Auth
mount(app, '/api/auth',       './routes/auth');
mount(app, '/api/roles',      './routes/roleRoutes');

// Users (site customers)
mount(app, '/api/users',      './routes/userRoutes');

// Catalog
mount(app, '/api/products',   './routes/Products');
mount(app, '/api/categories', './routes/categories');

// Sales
mount(app, '/api/orders',     './routes/orders');
mount(app, '/api/enquiries',  './routes/enquiries');
mount(app, '/api/coupons',    './routes/couponRoutes');

// Payments
mount(app, '/api/razorpay',   './routes/razorpayRoutes');

// Content
mount(app, '/api/banners',    './routes/banners');
mount(app, '/api/blogs',      './routes/blogRoutes');
mount(app, '/api/pages',      './routes/pageRoutes');
mount(app, '/api/media',      './routes/mediaRoutes');

// Marketing / SEO
mount(app, '/api/seo',        './routes/seoRoutes');

// System
mount(app, '/api/settings',   './routes/settingsRoutes');
mount(app, '/api/logs',       './routes/logsRoute');
mount(app, '/api/notifications', './routes/notificationRoutes');

// Health check
app.get('/', (req, res) => res.json({ message: 'Axiom Seeds API running ✅', time: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`\n🚀 Axiom Seeds server on port ${PORT}\n`));
