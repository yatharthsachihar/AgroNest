const express = require('express');
const Settings      = require('../models/Settings');
const StoreSettings = require('../models/StoreSettings');
const router = express.Router();

// Sync Settings → StoreSettings (keeps the orphaned collection in sync)
async function syncStoreSettings(settings) {
  try {
    let ss = await StoreSettings.findOne();
    if (!ss) ss = new StoreSettings();
    ss.storeName     = settings.storeName      || ss.storeName;
    ss.tagline       = settings.tagline        || ss.tagline;
    ss.logo          = settings.storeLogo      || ss.logo;
    ss.storeMode     = settings.storeMode      || ss.storeMode;
    ss.contactEmail  = settings.storeEmail     || ss.contactEmail;
    ss.contactPhone  = settings.storePhone     || ss.contactPhone;
    ss.address       = settings.storeAddress   || ss.address;
    ss.heroTitle     = settings.heroTitle      || ss.heroTitle;
    ss.heroSubtitle  = settings.heroSubtitle   || ss.heroSubtitle;
    ss.showPricesInB2B = settings.showPricesInB2B ?? ss.showPricesInB2B;
    ss.freeShippingAbove = settings.freeShippingAbove ?? ss.freeShippingAbove;
    if (settings.socialLinks) {
      ss.socialLinks = {
        ...ss.socialLinks?.toObject?.() || {},
        ...settings.socialLinks?.toObject?.() || {},
      };
    }
    await ss.save();
  } catch (err) {
    // Non-fatal — log but don't block the main settings save
    console.warn('[StoreSettings sync]', err.message);
  }
}

const optionalAuth = (req, res, next) => {
  const { protect } = require('../middleware/authMiddleware');
  const token = req.headers.authorization?.split(' ')[1];
  if (token) return protect(req, res, next);
  next();
};

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

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
      'seoSiteName','seoTitle','seoDescription','seoCanonical','seoKeywords','seoGoogleVerify','seoBingVerify',
      'ogTitle','ogDescription','ogImage','twitterCard','twitterHandle','twitterTitle','twitterDescription',
      'schemaOrgName','schemaOrgUrl','schemaOrgLogo','schemaOrgFounded','schemaOrgPhone','schemaOrgEmail',
      'schemaAddress','schemaCity','schemaState','schemaPostal',
      'robotsTxt','gaId','gtmId','fbPixelId','hotjarId',
      'navLinks','footerTagline','footerQuickLinks','footerSupportLinks','footerCompanyLinks','footerCopyright','footerPayments',
      'footerLogoHeight','footerLogoXOffset',
      'socialFacebook','socialInstagram','socialWhatsapp','socialYoutube','socialTwitter','socialLinkedin',
    ];

    allowed.forEach(key => {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    });

    ['homeTestimonials','contactOffices','homeBrands','aboutWhyUs','aboutTeam','aboutMilestones'].forEach(key => {
      if (req.body[key] !== undefined) settings.markModified(key);
    });

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

    // ── Keep StoreSettings collection in sync ──
    await syncStoreSettings(settings);

    res.json(settings);
  } catch (err) {
    console.error('Settings save error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
