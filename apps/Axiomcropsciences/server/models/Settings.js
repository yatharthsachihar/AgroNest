const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Store identity
  storeName:    { type: String, default: 'Axiom Seeds' },
  tagline:      { type: String, default: 'हमारा संकल्प, आत्मनिर्भर किसान' },
  storeLogo:    { type: String, default: '' },
  storeLogoHeight: { type: Number, default: 44 },
  storeLogoXOffset: { type: Number, default: 0 },
  storeLogoYOffset: { type: Number, default: 0 },
  currency:     { type: String, default: 'INR' },
  gstNumber:    { type: String, default: '' },

  // Contact
  storeEmail:   { type: String, default: '' },
  storePhone:   { type: String, default: '' },
  storeAddress: { type: String, default: '' },

  // Homepage / Hero layout
  heroHeight:     { type: String, default: '100vh' },    // e.g. '100vh', '80vh', '600px'
  heroWidth:      { type: String, default: '100%' },     // e.g. '100%', '1320px'
  heroOverlayOpacity: { type: Number, default: 0.70 },   // 0–1

  // Theme — Axiom Seeds brand palette (matched to logo: forest green + lime accent)
  themePreset:    { type: String, default: 'axiom-green' },
  siteTheme:      { type: String, enum: ['light', 'dark'], default: 'light' },
  colorPrimary:   { type: String, default: '#1B7A3D' },
  colorSecondary: { type: String, default: '#A8D95C' },
  colorBg:        { type: String, default: '#f6f9f3' },
  colorCard:      { type: String, default: '#ffffff' },
  colorText:      { type: String, default: '#18241c' },
  colorBorder:    { type: String, default: '#dfe9d4' },
  fontBody:       { type: String, default: 'Inter' },
  fontDisplay:    { type: String, default: 'Playfair Display' },
  borderRadius:   { type: String, default: '16px' },
  buttonRadius:   { type: String, default: '14px' },

  // Store mode
  storeMode:        { type: String, enum: ['b2b', 'b2c', 'hybrid'], default: 'hybrid' },
  showPricesInB2B:  { type: Boolean, default: false },

  // Announcement bar
  announcementBar:    { type: String, default: '🌾 Free delivery above ₹999 | Certified organic products' },
  announcementActive: { type: Boolean, default: true },

  // Hero section
  heroTitle:    { type: String, default: 'Grow More. Worry Less. Harvest Better.' },
  heroSubtitle: { type: String, default: 'From certified seeds to organic fertilizers — everything your farm needs, delivered to your door.' },
  heroCTA1Text: { type: String, default: 'Shop Now' },
  heroCTA1Link: { type: String, default: '/products' },
  heroCTA2Text: { type: String, default: 'Explore Categories' },
  heroCTA2Link: { type: String, default: '/categories' },

  // Floating stat cards on hero
  statFarmers:      { type: String, default: '50K+' },
  statProducts:     { type: String, default: '2K+' },
  statSatisfaction: { type: String, default: '98%' },

  // Editable homepage social proof
  brandsLabel:      { type: String, default: 'Trusted Brands We Stock' },
  homeBrands:       { type: [String], default: [] },           // brand ticker entries
  homeTestimonials: {                                            // homepage reviews
    type: [{
      name:     { type: String, default: '' },
      location: { type: String, default: '' },
      crop:     { type: String, default: '' },
      rating:   { type: Number, default: 5 },
      text:     { type: String, default: '' },
    }],
    default: [],
  },

  // ── About page (admin-editable) ──
  aboutHeroBadge:    { type: String, default: 'Our Story' },
  aboutHeroTitle:    { type: String, default: 'Quality Seeds for the Self-Reliant Farmer' },
  aboutHeroSubtitle: { type: String, default: 'Research-bred and hybrid seed varieties developed to give farmers dependable germination, stronger crops, and better yields.' },
  aboutHeroImage:    { type: String, default: '' },
  aboutStoryHeading: { type: String, default: 'Who We Are' },
  aboutStoryText:    { type: String, default: 'We are a seed company focused on developing and supplying high-quality research and hybrid seeds across a wide range of crops — from bajra and maize to mustard, castor, cumin and fodder varieties. Every variety is selected to perform in real field conditions.' },
  aboutMissionHeading: { type: String, default: 'Our Mission' },
  aboutMissionText:  { type: String, default: 'To empower farmers with seeds they can trust — improving productivity and supporting a more self-reliant farming community.' },
  aboutWhyUs: {
    type: [{
      icon:  { type: String, default: '🌱' },
      title: { type: String, default: '' },
      desc:  { type: String, default: '' },
    }],
    default: [],
  },
  aboutTeam: {
    type: [{
      name:   { type: String, default: '' },
      role:   { type: String, default: '' },
      bio:    { type: String, default: '' },
      avatar: { type: String, default: '' },
    }],
    default: [],
  },
  aboutMilestones: {
    type: [{
      year:  { type: String, default: '' },
      title: { type: String, default: '' },
      desc:  { type: String, default: '' },
    }],
    default: [],
  },

  // Editable Contact page office blocks
  contactOffices: {
    type: [{
      city:    { type: String, default: '' },
      address: { type: String, default: '' },
      phone:   { type: String, default: '' },
      email:   { type: String, default: '' },
      hours:   { type: String, default: '' },
    }],
    default: [],
  },

  // CTA button labels
  b2bCtaText:    { type: String, default: 'Request a Quote' },
  b2bCtaSubtext: { type: String, default: 'Bulk orders | Custom pricing | Dedicated support' },
  retailCtaText: { type: String, default: 'Add to Cart' },

  // Homepage section visibility flags
  showFeaturedCategories: { type: Boolean, default: true },
  showFeaturedProducts:   { type: Boolean, default: true },
  showSeasonalBanner:     { type: Boolean, default: true },
  showBestSellers:        { type: Boolean, default: true },
  showBrandsSection:      { type: Boolean, default: true },
  showTestimonials:       { type: Boolean, default: true },
  showBlogSection:        { type: Boolean, default: true },
  showNewsletter:         { type: Boolean, default: true },

  // Site page visibility flags — controls nav links + route access for entire pages
  pageVisibility: {
    shop:       { type: Boolean, default: true },
    categories: { type: Boolean, default: true },
    blog:       { type: Boolean, default: true },
    about:      { type: Boolean, default: true },
    contact:    { type: Boolean, default: true },
  },

  // Social links
  socialLinks: {
    facebook:  { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter:   { type: String, default: '' },
    youtube:   { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    whatsapp:  { type: String, default: '' },
  },

  socialFacebook: { type: String, default: '' },
  socialInstagram: { type: String, default: '' },
  socialWhatsapp: { type: String, default: '' },
  socialYoutube: { type: String, default: '' },
  socialTwitter: { type: String, default: '' },
  socialLinkedin: { type: String, default: '' },

  // Header & Navigation
  navLinks: { type: Array, default: [] },

  // Footer Config
  footerLogoHeight: { type: Number, default: 44 },
  footerLogoXOffset: { type: Number, default: 0 },
  footerTagline: { type: String, default: '' },
  footerQuickLinks: { type: Array, default: [] },
  footerSupportLinks: { type: Array, default: [] },
  footerCompanyLinks: { type: Array, default: [] },
  footerCopyright: { type: String, default: '' },
  footerPayments: { type: String, default: '' },

  // Business / payment
  razorpayKey:       { type: String, default: '' },
  razorpaySecret:    { type: String, default: '' },
  razorpayWebhookSecret: { type: String, default: '' },
  razorpayMode:      { type: String, default: 'live' },
  razorpayActive:    { type: Boolean, default: true },

  codActive:         { type: Boolean, default: true },

  phonepeMerchantId: { type: String, default: '' },
  phonepeSaltKey:    { type: String, default: '' },
  phonepeSaltIndex:  { type: String, default: '1' },
  phonepeEnv:        { type: String, default: 'production' },
  phonepeActive:     { type: Boolean, default: true },
  
  freeShippingAbove: { type: Number, default: 999 },
  taxRate:           { type: Number, default: 0 },

  // SMTP
  smtpEnabled: { type: Boolean, default: false },
  smtpFromName: { type: String, default: 'Axiom Seeds' },
  smtpFromEmail: { type: String, default: 'noreply@axiomcropsciences.in' },
  smtp: {
    host:     { type: String, default: '' },
    port:     { type: Number, default: 587 },
    user:     { type: String, default: '' },
    password: { type: String, default: '' },
  },

  // Cloudinary
  cloudinaryEnabled: { type: Boolean, default: false },
  cloudinaryCloudName: { type: String, default: '' },
  cloudinaryApiKey: { type: String, default: '' },
  cloudinaryApiSecret: { type: String, default: '' },
  cloudinaryUploadPreset: { type: String, default: '' },

  // WhatsApp
  whatsappEnabled: { type: Boolean, default: false },
  whatsappNumber: { type: String, default: '' },
  whatsappApiToken: { type: String, default: '' },

  // SEO — General
  seoSiteName:      { type: String, default: '' },
  seoTitle:         { type: String, default: '' },
  seoDescription:   { type: String, default: '' },
  seoCanonical:     { type: String, default: '' },
  seoKeywords:      { type: String, default: '' },
  seoGoogleVerify:  { type: String, default: '' },
  seoBingVerify:    { type: String, default: '' },

  // SEO — Open Graph / Social
  ogTitle:             { type: String, default: '' },
  ogDescription:       { type: String, default: '' },
  ogImage:             { type: String, default: '' },
  twitterCard:         { type: String, default: 'summary_large_image' },
  twitterHandle:       { type: String, default: '' },
  twitterTitle:        { type: String, default: '' },
  twitterDescription:  { type: String, default: '' },

  // SEO — Structured Data (Organization)
  schemaOrgName:    { type: String, default: '' },
  schemaOrgUrl:     { type: String, default: '' },
  schemaOrgLogo:    { type: String, default: '' },
  schemaOrgFounded: { type: String, default: '' },
  schemaOrgPhone:   { type: String, default: '' },
  schemaOrgEmail:   { type: String, default: '' },

  // SEO — Structured Data (Local Business)
  schemaAddress: { type: String, default: '' },
  schemaCity:    { type: String, default: '' },
  schemaState:   { type: String, default: '' },
  schemaPostal:  { type: String, default: '' },

  // SEO — Sitemap, Robots & Tracking
  robotsTxt: { type: String, default: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: /sitemap.xml' },
  gaId:      { type: String, default: '' },
  gtmId:     { type: String, default: '' },
  fbPixelId: { type: String, default: '' },
  hotjarId:  { type: String, default: '' },

  // Permission matrix (editable by super_admin via Roles page)
  permissionMatrix: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
