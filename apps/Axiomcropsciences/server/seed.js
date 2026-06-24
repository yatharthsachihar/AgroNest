require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const Admin    = require('./models/Admin');
const Category = require('./models/Category');
const Product  = require('./models/Product');
const Banner   = require('./models/Banner');
const Settings = require('./models/Settings');

const seed = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiomcropsciences';
  const fallbackUri = uri.includes('localhost') ? uri.replace('localhost', '127.0.0.1') : uri;

  try {
    await mongoose.connect(fallbackUri);
    console.log(`✅ Connected to MongoDB: ${fallbackUri}`);
  } catch (err) {
    console.error(`❌ Connection to MongoDB ${fallbackUri} failed:`, err.message);
    if (fallbackUri !== uri) {
      console.log(`Retrying connection with original URI: ${uri}`);
      await mongoose.connect(uri);
      console.log(`✅ Connected to MongoDB: ${uri}`);
    } else {
      throw err;
    }
  }

  console.log('Checking database state...');

  // ── Super Admin ──────────────────────────────────────────────
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@axiomcropsciences.in',
      password: 'admin123',
      role: 'superadmin',
    });
    console.log('👤 Admin created: admin@axiomcropsciences.in / admin123');
  } else {
    console.log('👤 Admin already exists, skipping.');
  }

  // ── Settings ────────────────────────────────────────────────
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      storeName: 'Axiom Seeds',
      tagline: 'हमारा संकल्प, आत्मनिर्भर किसान',
      storeMode: 'hybrid',
      showPricesInB2B: false,
      freeShippingAbove: 999,
      storeEmail: 'axiomcropsciences@gmail.com',
      storePhone: '+91 7340008599',
      storeAddress: 'B-235 Sobo Centre Gym Khana Road Bhopal Ahmedabad (Gujrat)382210',
      currency: 'INR',
      gstNumber: '08AABCU9603R1ZX',
      taxRate: 5,
      announcementActive: true,
      announcementBar: '🌾 Free delivery above ₹999  |  Certified organic products  |  Agri Helpline: 1800-AXIOM',
      heroTitle: 'Grow More. Worry Less. Harvest Better.',
      heroSubtitle: 'From certified seeds to organic fertilizers — everything your farm needs, delivered to your door. Trusted by 50,000+ farmers across India.',
      heroCTA1Text: 'Shop Now',
      heroCTA1Link: '/products',
      heroCTA2Text: 'Explore Categories',
      heroCTA2Link: '/categories',
      statFarmers: '50K+',
      statProducts: '2K+',
      statSatisfaction: '98%',
      socialLinks: {
        facebook:  'https://facebook.com/axiomcropsciences',
        instagram: 'https://instagram.com/axiomcropsciences',
        youtube:   'https://youtube.com/@axiomcropsciences',
      },
    });
    console.log('⚙️  Settings created');
  } else {
    console.log('⚙️  Settings already exist, skipping.');
  }

  // ── Banners ─────────────────────────────────────────────────
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    await Banner.insertMany([
      {
        title: 'Kharif Season Sale',
        subtitle: 'Up to 40% off on paddy seeds, sugarcane saplings & kharif fertilizers',
        badge: 'Limited Time',
        ctaText: 'Shop Kharif Range',
        link: '/products?season=kharif',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80',
        isActive: true,
        displayOrder: 1,
      },
      {
        title: 'Certified Organic Seeds',
        subtitle: 'India\'s largest range of certified organic seeds — ship same day',
        badge: 'New Arrivals',
        ctaText: 'Explore Seeds',
        link: '/products?category=seeds',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=80',
        isActive: true,
        displayOrder: 2,
      },
      {
        title: 'Wholesale / B2B Enquiries',
        subtitle: 'Bulk pricing for cooperatives, agri-businesses & distributors',
        badge: 'B2B Program',
        ctaText: 'Get Quote',
        link: '/contact?type=bulk',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=80',
        isActive: true,
        displayOrder: 3,
      },
    ]);
    console.log('🖼️  3 banners created');
  } else {
    console.log('🖼️  Banners already exist, skipping.');
  }

  // ── Categories ───────────────────────────────────────────────
  let categoriesList = [];
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    categoriesList = await Category.insertMany([
      {
        name: 'Seeds', slug: 'seeds', displayOrder: 1, status: 'active',
        icon: '🌾',
        description: 'Certified hybrid & organic seeds for every crop and season',
        image: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800&q=80',
      },
      {
        name: 'Fertilizers', slug: 'fertilizers', displayOrder: 2, status: 'active',
        icon: '🌿',
        description: 'Macro & micro nutrient fertilizers for maximum soil health',
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80',
      },
      {
        name: 'Pesticides', slug: 'pesticides', displayOrder: 3, status: 'active',
        icon: '🛡️',
        description: 'Insecticides, fungicides & bactericides for crop protection',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
      },
      {
        name: 'Irrigation', slug: 'irrigation', displayOrder: 4, status: 'active',
        icon: '💧',
        description: 'Drip systems, sprinklers & water management tools',
        image: 'https://images.unsplash.com/photo-1563514227147-6d2af9a0c3b5?w=800&q=80',
      },
      {
        name: 'Farm Tools', slug: 'farm-tools', displayOrder: 5, status: 'active',
        icon: '🔧',
        description: 'Hand tools, power tools & farm machinery attachments',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
      },
      {
        name: 'Organic', slug: 'organic', displayOrder: 6, status: 'active',
        icon: '🍃',
        description: '100% natural — compost, biofertilizers & organic sprays',
        image: 'https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?w=800&q=80',
      },
    ]);
    console.log('📂 6 categories created');
  } else {
    console.log('📂 Categories already exist, loading them.');
    categoriesList = await Category.find({});
  }

  // ── Products ────────────────────────────────────────────────
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    // Map slugs to ObjectIDs
    const categoryMap = {};
    categoriesList.forEach(c => {
      categoryMap[c.slug] = c._id;
    });

    const getCatId = (slug) => categoryMap[slug] || categoriesList[0]?._id;

    await Product.insertMany([
      // SEEDS
      {
        name: 'Hybrid Tomato Seeds (50g)',
        slug: 'hybrid-tomato-seeds',
        category: getCatId('seeds'),
        price: 299, originalPrice: 399,
        stock: 500, unit: 'packet',
        shortDescription: 'High-yield hybrid tomato — 95%+ germination, disease resistant',
        description: 'Premium F1 hybrid tomato seeds with excellent shelf life and high yield. Resistant to early blight and mosaic virus. Expected yield: 40-60 tons/acre.',
        specifications: [
          { key: 'Variety', value: 'Hybrid F1' },
          { key: 'Germination', value: '95%' },
          { key: 'Maturity', value: '60-70 days' },
        ],
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
        isFeatured: true, isBestSeller: true, isNewArrival: false,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
        badge: 'Best Seller', isOrganic: false,
      },
      {
        name: 'NPK Fertilizer 19:19:19 (5kg)',
        slug: 'npk-19-19-19-5kg',
        category: getCatId('fertilizers'),
        price: 649, originalPrice: 850,
        stock: 800, unit: 'bag',
        shortDescription: 'Balanced water-soluble NPK for all crops and growth stages',
        description: 'Fully water soluble NPK 19:19:19 suitable for fertigation, drip and foliar application. Ensures balanced nutrition throughout the crop lifecycle.',
        specifications: [
          { key: 'N-P-K Ratio', value: '19:19:19' },
          { key: 'Solubility', value: '100% water soluble' },
          { key: 'Application', value: 'Drip, Foliar, Fertigation' },
        ],
        images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&q=80'],
        isFeatured: true, isBestSeller: true, isTrending: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
        badge: 'Top Pick',
      },
      {
        name: 'Drip Irrigation Starter Kit',
        slug: 'drip-irrigation-starter-kit',
        category: getCatId('irrigation'),
        price: 1899, originalPrice: 2499,
        stock: 120, unit: 'kit',
        shortDescription: 'Complete drip system for 1 acre — saves 60% water',
        description: 'Includes main pipe, sub-main, drippers, filters and connectors. Suitable for vegetables, fruits and row crops. Easy DIY installation.',
        images: ['https://images.unsplash.com/photo-1563514227147-6d2af9a0c3b5?w=600&q=80'],
        isFeatured: true, isTopProduct: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
        badge: 'Save Water',
      },
      {
        name: 'Organic Neem Pesticide 1L',
        slug: 'organic-neem-pesticide-1l',
        category: getCatId('pesticides'),
        price: 349, originalPrice: 450,
        stock: 600, unit: 'bottle',
        shortDescription: 'Cold-pressed neem oil — broad spectrum organic pest control',
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80'],
        isFeatured: true, isBestSeller: true, isOrganic: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Hybrid Paddy Seeds PR-126 (1kg)',
        slug: 'paddy-seeds-pr-126',
        category: getCatId('seeds'),
        price: 199, stock: 1200, unit: 'packet',
        shortDescription: 'Popular short-duration paddy for Punjab, Haryana & UP',
        images: ['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'],
        isTrending: true, isNewArrival: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Vermicompost Premium 10kg',
        slug: 'vermicompost-premium-10kg',
        category: getCatId('organic'),
        price: 399, originalPrice: 499,
        stock: 400, unit: 'bag',
        shortDescription: 'Earthworm-processed organic compost for soil enrichment',
        images: ['https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?w=600&q=80'],
        isFeatured: true, isOrganic: true, isBestSeller: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Forged Steel Garden Spade',
        slug: 'forged-steel-spade',
        category: getCatId('farm-tools'),
        price: 849, originalPrice: 1099,
        stock: 200, unit: 'piece',
        shortDescription: 'Heavy duty forged spade with ergonomic handle',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'],
        isTopProduct: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'DAP Fertilizer (50kg)',
        slug: 'dap-fertilizer-50kg',
        category: getCatId('fertilizers'),
        price: 1400, stock: 900, unit: 'bag',
        shortDescription: 'Di-ammonium phosphate — most widely used starter fertilizer',
        images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&q=80'],
        isBestSeller: true, isFeatured: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Imidacloprid 17.8% SL (250ml)',
        slug: 'imidacloprid-17-8-sl',
        category: getCatId('pesticides'),
        price: 620, stock: 450, unit: 'bottle',
        shortDescription: 'Systemic insecticide — controls whitefly, aphids & BPH',
        isFeatured: true, isTopProduct: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Hybrid Chilli Seeds (10g)',
        slug: 'hybrid-chilli-seeds-10g',
        category: getCatId('seeds'),
        price: 1150, originalPrice: 1400,
        stock: 180, unit: 'packet',
        shortDescription: 'High yielding hybrid chilli for red and green markets',
        isFeatured: true, isNewArrival: true, isSeasonal: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
        badge: 'New',
      },
      {
        name: 'Calcium Nitrate Fertilizer 2kg',
        slug: 'calcium-nitrate-2kg',
        category: getCatId('fertilizers'),
        price: 279, originalPrice: 349,
        stock: 550, unit: 'bag',
        shortDescription: 'Prevents blossom end rot — ideal for tomato and pepper',
        isTrending: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
      {
        name: 'Sprinkler Irrigation Set',
        slug: 'sprinkler-irrigation-set',
        category: getCatId('irrigation'),
        price: 1299, originalPrice: 1699,
        stock: 85, unit: 'set',
        shortDescription: 'Rotary sprinkler set for 20ft coverage — ideal for lawns & nurseries',
        isNewArrival: true,
        visibleInB2B: true, visibleInB2C: true, status: 'active',
      },
    ]);
    console.log('📦 12 products created');
  } else {
    console.log('📦 Products already exist in database. Staying in server.');
  }

  console.log('\n🎉 Seed complete! Ready to run.');
  process.exit();
};

seed().catch(err => { console.error(err); process.exit(1); });
