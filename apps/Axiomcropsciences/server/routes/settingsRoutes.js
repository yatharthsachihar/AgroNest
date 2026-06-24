const express = require('express');
const Settings = require('../models/Settings');
const router = express.Router();

// Optionally attach protect — if token present, verify it, but don't block unauthenticated reads/writes
// for the admin panel in development. Re-add strict auth when deploying.
const optionalAuth = (req, res, next) => {
  const { protect } = require('../middleware/authMiddleware');
  const token = req.headers.authorization?.split(' ')[1];
  if (token) return protect(req, res, next);
  next();
};

// GET /api/settings  — public, always works
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/settings  — safe merge, won't wipe nested fields
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    // Safe field-by-field update — prevents Object.assign nuking nested subdocs
    const allowed = [
      'storeName','tagline','storeLogo','storeLogoHeight','storeLogoXOffset','storeLogoYOffset','currency','gstNumber',
      'storeEmail','storePhone','storeAddress',
      'heroHeight','heroWidth','heroOverlayOpacity',
      'themePreset','siteTheme','colorPrimary','colorSecondary',
      'colorBg','colorCard','colorText','colorBorder',
      'fontBody','fontDisplay','borderRadius','buttonRadius',
      'storeMode','showPricesInB2B',
      'announcementBar','announcementActive',
      'heroTitle','heroSubtitle','heroCTA1Text','heroCTA1Link','heroCTA2Text','heroCTA2Link',
      'statFarmers','statProducts','statSatisfaction',
      'brandsLabel','homeBrands','homeTestimonials','contactOffices',
      'aboutHeroBadge','aboutHeroTitle','aboutHeroSubtitle','aboutHeroImage',
      'aboutStoryHeading','aboutStoryText','aboutMissionHeading','aboutMissionText',
      'aboutWhyUs','aboutTeam','aboutMilestones',
      'b2bCtaText','b2bCtaSubtext','retailCtaText',
      'showFeaturedCategories','showFeaturedProducts','showSeasonalBanner',
      'showBestSellers','showBrandsSection','showTestimonials','showBlogSection','showNewsletter',
      'razorpayKey','razorpaySecret','razorpayWebhookSecret','razorpayMode','razorpayActive',
      'phonepeMerchantId','phonepeSaltKey','phonepeSaltIndex','phonepeEnv','phonepeActive',
      'codActive','freeShippingAbove','taxRate',
      'smtpEnabled','smtpFromName','smtpFromEmail',
      'cloudinaryEnabled','cloudinaryCloudName','cloudinaryApiKey','cloudinaryApiSecret','cloudinaryUploadPreset',
      'whatsappEnabled','whatsappNumber','whatsappApiToken',
      // SEO
      'seoSiteName','seoTitle','seoDescription','seoCanonical','seoKeywords','seoGoogleVerify','seoBingVerify',
      'ogTitle','ogDescription','ogImage','twitterCard','twitterHandle','twitterTitle','twitterDescription',
      'schemaOrgName','schemaOrgUrl','schemaOrgLogo','schemaOrgFounded','schemaOrgPhone','schemaOrgEmail',
      'schemaAddress','schemaCity','schemaState','schemaPostal',
      'robotsTxt','gaId','gtmId','fbPixelId','hotjarId',
      // Header & Footer Customizer
      'navLinks','footerTagline','footerQuickLinks','footerSupportLinks','footerCompanyLinks','footerCopyright','footerPayments',
      'footerLogoHeight', 'footerLogoXOffset',
      'socialFacebook','socialInstagram','socialWhatsapp','socialYoutube','socialTwitter','socialLinkedin'
    ];

    allowed.forEach(key => {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    });

    // Ensure replaced arrays-of-objects are flagged dirty so Mongoose saves them.
    ['homeTestimonials','contactOffices','homeBrands','aboutWhyUs','aboutTeam','aboutMilestones'].forEach(key => {
      if (req.body[key] !== undefined) settings.markModified(key);
    });

    // Handle nested objects explicitly
    if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
      settings.socialLinks = { ...settings.socialLinks?.toObject?.() || {}, ...req.body.socialLinks };
    }
    if (req.body.smtp && typeof req.body.smtp === 'object') {
      settings.smtp = { ...settings.smtp?.toObject?.() || {}, ...req.body.smtp };
    }
    if (req.body.pageVisibility && typeof req.body.pageVisibility === 'object') {
      settings.pageVisibility = { ...settings.pageVisibility?.toObject?.() || {}, ...req.body.pageVisibility };
      settings.markModified('pageVisibility');
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('Settings save error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
