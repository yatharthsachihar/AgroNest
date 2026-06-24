// ──────────────────────────────────────────────────────────────
// Deep search index for the admin command palette.
//
// Every searchable control/setting/section in the admin lives here as one
// entry. Typing any of its keywords surfaces it and jumps to the page (and,
// where supported, the tab) that owns it. This is what lets search "go deep"
// past page names into the actual buttons and settings.
//
// Each entry: { label, keywords[], path, group, hint? }
//  - path may include a query string (e.g. ?tab=stats) for pages that read it.
// ──────────────────────────────────────────────────────────────

export const FEATURE_INDEX = [
  // ── Store mode (single editor: Homepage Builder) ──
  { label: "Store Mode (Retail / Wholesale / Hybrid)", group: "Settings", path: "/admin/homepage-builder?tab=stats",
    keywords: ["store mode", "b2c", "b2b", "retail", "wholesale", "hybrid", "switch mode", "show prices"], hint: "Homepage Builder › Stats & Trust" },

  // ── Homepage Builder ──
  { label: "Hero Headline & Subtitle", group: "Homepage", path: "/admin/homepage-builder?tab=hero",
    keywords: ["hero", "headline", "title", "subtitle", "banner text", "homepage hero"] },
  { label: "About Page (story, mission, team, milestones)", group: "Appearance", path: "/admin/about-builder",
    keywords: ["about", "about page", "story", "mission", "team", "milestones", "why choose us"] },
  { label: "Homepage Reviews / Testimonials", group: "Homepage", path: "/admin/homepage-builder?tab=reviews",
    keywords: ["reviews", "testimonials", "customer reviews", "ratings"] },
  { label: "Brand / Partner Ticker", group: "Homepage", path: "/admin/homepage-builder?tab=brands",
    keywords: ["brands", "ticker", "partners", "trusted brands", "logos"] },
  { label: "Contact Office Blocks", group: "Homepage", path: "/admin/homepage-builder?tab=contact",
    keywords: ["contact blocks", "offices", "branches", "addresses"] },
  { label: "Hero CTA Buttons", group: "Homepage", path: "/admin/homepage-builder?tab=hero",
    keywords: ["cta", "call to action", "shop now button", "hero buttons"] },
  { label: "Announcement Bar", group: "Homepage", path: "/admin/homepage-builder?tab=announcement",
    keywords: ["announcement", "top bar", "scrolling bar", "marquee", "notice bar"] },
  { label: "Homepage Section Visibility", group: "Homepage", path: "/admin/homepage-builder?tab=sections",
    keywords: ["sections", "featured", "best sellers", "new arrivals", "testimonials", "brands", "show section", "hide section"] },
  { label: "Hero Floating Stats", group: "Homepage", path: "/admin/homepage-builder?tab=stats",
    keywords: ["stats", "farmers count", "products count", "satisfaction"] },

  // ── Settings ──
  { label: "Store Information (name, tagline, currency)", group: "Settings", path: "/admin/settings",
    keywords: ["store name", "business name", "tagline", "currency", "store info"] },
  { label: "Store Logo", group: "Settings", path: "/admin/settings",
    keywords: ["logo", "store logo", "brand logo", "logo height", "logo url"] },
  { label: "Contact Details (phone, email, address)", group: "Settings", path: "/admin/settings",
    keywords: ["contact", "phone", "email", "address", "support number"] },
  { label: "Social Links", group: "Settings", path: "/admin/settings",
    keywords: ["social", "instagram", "facebook", "twitter", "youtube", "linkedin", "social media"] },
  { label: "Free Shipping Threshold", group: "Settings", path: "/admin/settings",
    keywords: ["free shipping", "shipping", "delivery charge", "shipping threshold", "free delivery"] },
  { label: "Tax / GST Settings", group: "Settings", path: "/admin/settings",
    keywords: ["tax", "gst", "vat", "tax rate"] },
  { label: "Payment Methods (COD / Razorpay / PhonePe)", group: "Settings", path: "/admin/settings",
    keywords: ["payment", "cod", "cash on delivery", "razorpay", "phonepe", "online payment"] },

  // ── Integrations ──
  { label: "Razorpay Integration", group: "Integrations", path: "/admin/integrations",
    keywords: ["razorpay", "payment gateway", "razorpay key", "razorpay secret"] },
  { label: "PhonePe Integration", group: "Integrations", path: "/admin/integrations",
    keywords: ["phonepe", "upi", "payment gateway"] },
  { label: "SMTP / Email Integration", group: "Integrations", path: "/admin/integrations",
    keywords: ["smtp", "email", "mail", "transactional email", "email server"] },
  { label: "WhatsApp Integration", group: "Integrations", path: "/admin/integrations",
    keywords: ["whatsapp", "whatsapp number", "chat"] },

  // ── Theme / Website builders ──
  { label: "Theme Colours & Fonts", group: "Appearance", path: "/admin/theme-builder",
    keywords: ["theme", "colours", "colors", "primary color", "font", "border radius", "dark mode", "light mode", "palette"] },
  { label: "Website Design & Page Visibility", group: "Appearance", path: "/admin/website-builder",
    keywords: ["website builder", "design", "page visibility", "hide page", "show page", "layout"] },
  { label: "Header / Navbar Builder", group: "Appearance", path: "/admin/header-builder",
    keywords: ["header", "navbar", "navigation links", "menu links", "header logo"] },
  { label: "Footer Builder", group: "Appearance", path: "/admin/footer-builder",
    keywords: ["footer", "footer links", "footer columns", "social footer", "copyright"] },

  // ── SEO ──
  { label: "SEO Meta & Open Graph", group: "Marketing", path: "/admin/seo",
    keywords: ["seo", "meta title", "meta description", "og image", "open graph", "google analytics", "robots", "sitemap"] },

  // ── Catalog actions ──
  { label: "Add New Product", group: "Catalog", path: "/admin/products/create",
    keywords: ["add product", "new product", "create product"] },
  { label: "Manage Inventory & Stock", group: "Catalog", path: "/admin/inventory",
    keywords: ["inventory", "stock", "stock adjustment", "low stock", "restock"] },
  { label: "Collections (Featured / Best Seller / New Arrival …)", group: "Catalog", path: "/admin/collections",
    keywords: ["collections", "featured", "best seller", "new arrival", "top product", "trending", "seasonal", "merchandising", "homepage products"] },
  { label: "Manage Categories", group: "Catalog", path: "/admin/categories",
    keywords: ["category", "categories", "add category"] },
  { label: "Coupons & Discounts", group: "Marketing", path: "/admin/coupons",
    keywords: ["coupon", "discount", "promo code", "offer"] },

  // ── System ──
  { label: "Roles & Permissions", group: "System", path: "/admin/roles",
    keywords: ["roles", "permissions", "access", "permission matrix", "team access"] },
  { label: "Admin Users / Team", group: "System", path: "/admin/users",
    keywords: ["users", "admin users", "team", "staff", "add admin"] },
  { label: "Activity Logs", group: "System", path: "/admin/logs",
    keywords: ["logs", "activity", "audit", "history"] },
  { label: "Media Library", group: "System", path: "/admin/media",
    keywords: ["media", "images", "uploads", "files", "gallery"] },
];
