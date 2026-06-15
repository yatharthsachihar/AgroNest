# AgroNest — Project Audit & Memory File
> Last updated: Multer fix + navbar flicker fix + SettingsContext localStorage cache

---

## Project Structure
- **Frontend**: `apps/AgroNest/client` — React + Vite, port 5173
- **Backend**: `apps/AgroNest/server` — Node.js + Express + MongoDB, port 5001
- **Admin panel**: `/admin/*` routes inside the same React app
- **Admin login**: `/admin/login` → `pages/AdminLogin.jsx`
- **Admin credentials** (seeded): `admin@agronest.in` / `admin123`
- **Audit file location**: `apps/AgroNest/server/AgroNest_audit.md`

---

## Architecture Decisions
- `ThemeContext` sets `data-theme` on `<html>` — dark by default
- `SettingsContext` fetches `/api/settings` on mount — drives homepage sections, hero text, mode, nav visibility
- `SettingsContext` caches settings to `localStorage` key `agronest_settings_cache` — eliminates all UI flash on refresh
- `SettingsContext` polls every 15s so admin changes propagate to open tabs
- `CartContext` — localStorage-persisted cart
- `useAuthStore` (Zustand) — JWT stored in `localStorage` as `agronest_token`
- Admin auth uses `Admin` model + `authMiddleware.js`
- Site user auth uses `User` model + `userAuthMiddleware.js`
- `AdminLayout` redirects to `/admin/login` if no token
- `index.js` uses `mount()` helper — one bad route file won't crash the server
- `pageVisibility` in Settings controls which nav links show — blog/about default FALSE until server confirms true

---

## Database Models
| Model     | File                  | Notes                                      |
|-----------|-----------------------|--------------------------------------------|
| Admin     | models/Admin.js       | bcrypt + matchPassword method              |
| User      | models/User.js        | bcrypt + matchPassword + toPublic method   |
| Product   | models/Product.js     | isFeatured, isB2B, isB2C flags etc         |
| Category  | models/Category.js    | displayOrder, icon, image, slug            |
| Order     | models/Order.js       | items[], status, paymentMethod             |
| Enquiry   | models/Enquiry.js     | type, status, product ref                  |
| Banner    | models/Banner.js      | isActive, displayOrder, ctaText, link      |
| Blog      | models/Blog.js        | status draft/published/scheduled           |
| Page      | models/Page.js        | slug, content, status                      |
| Coupon    | models/Coupon.js      | type percentage/fixed, usageLimit          |
| Media     | models/Media.js       | folder, url, mimeType, filename, size      |
| Settings  | models/Settings.js    | Everything — hero, theme, social, smtp, pageVisibility, section flags |

---

## Server Routes
| Path                 | File                        | Auth                    |
|----------------------|-----------------------------|-------------------------|
| POST /api/auth/login | routes/auth.js              | Public                  |
| GET  /api/auth/me    | routes/auth.js              | Admin JWT               |
| /api/users           | routes/userRoutes.js        | Mixed                   |
| /api/products        | routes/Products.js          | Mixed (softAuth)        |
| /api/categories      | routes/categories.js        | Mixed                   |
| /api/orders          | routes/orders.js            | Mixed                   |
| /api/enquiries       | routes/enquiries.js         | Mixed                   |
| /api/coupons         | routes/couponRoutes.js      | Admin JWT               |
| /api/banners         | routes/banners.js           | Mixed                   |
| /api/blogs           | routes/blogRoutes.js        | Mixed                   |
| /api/pages           | routes/pageRoutes.js        | Mixed                   |
| /api/media           | routes/mediaRoutes.js       | Public upload + delete  |
| /api/seo             | routes/seoRoutes.js         | Admin JWT               |
| /api/settings        | routes/settingsRoutes.js    | GET public, PUT admin   |

---

## Middleware
| File                             | Purpose                                     |
|----------------------------------|---------------------------------------------|
| middleware/authMiddleware.js     | Admin JWT protect — sets req.admin          |
| middleware/userAuthMiddleware.js | Site user JWT protect — sets req.user       |
| middleware/uploadMiddleware.js   | Multer 2 + Express 5 compatible disk upload |

---

## Frontend Pages (Site)
| Route              | Component                               | Status       |
|--------------------|-----------------------------------------|--------------|
| /                  | pages/Home/HomePage.jsx                 | ✅ Done      |
| /products          | pages/Products/ProductsPage.jsx         | ✅ Done      |
| /products/:slug    | pages/Product/ProductDetailPage.jsx     | ✅ Done      |
| /categories        | pages/Categories/CategoriesPage.jsx     | ✅ Done      |
| /cart              | pages/Cart/CartPage.jsx                 | ✅ Done      |
| /checkout          | pages/Checkout/CheckoutPage.jsx         | ✅ Done      |
| /contact           | pages/Contact/ContactPage.jsx           | ✅ Done      |
| /blog              | Stub                                    | 🔲 Stub      |
| /about             | Stub                                    | 🔲 Stub      |
| /login, /register  | Stub (UserContext present)              | 🔲 Stub      |

---

## Frontend — Admin Panel Pages
| Route                      | Component                              | Status       |
|----------------------------|----------------------------------------|--------------|
| /admin                     | Dashboard (charts, stats)              | ✅ Done      |
| /admin/products            | Products CRUD table + search/filter    | ✅ Done      |
| /admin/products/create     | ProductCreatePage                      | ✅ Done      |
| /admin/products/edit/:id   | ProductEditPage                        | ✅ Done      |
| /admin/categories          | CategoriesPage (card grid + modal)     | ✅ Done      |
| /admin/orders              | OrdersPage (table + inline status)     | ✅ Done      |
| /admin/website-builder     | WebsiteBuilderPage (4 tabs: Content / Sections / Design / Store) | ✅ Done |
| /admin/enquiries           | Stub                                   | 🔲 Next      |
| /admin/coupons             | Stub                                   | 🔲 Next      |
| /admin/customers           | Stub                                   | 🔲 Next      |
| /admin/banners             | Stub                                   | 🔲 Next      |
| /admin/blogs               | Stub                                   | 🔲 Next      |
| /admin/pages               | Stub                                   | 🔲 Next      |
| /admin/header-builder      | Stub                                   | 🔲 Next      |
| /admin/footer-builder      | Stub                                   | 🔲 Next      |
| /admin/homepage-builder    | Stub                                   | 🔲 Next      |
| /admin/theme-builder       | Stub                                   | 🔲 Next      |
| /admin/seo                 | Stub                                   | 🔲 Next      |
| /admin/analytics           | Stub                                   | 🔲 Next      |
| /admin/media               | Stub                                   | 🔲 Next      |
| /admin/settings            | Stub                                   | 🔲 Next      |

---

## Key Components
| Component                                        | Notes                                               |
|--------------------------------------------------|-----------------------------------------------------|
| components/navigation/Navbar.jsx                 | Full — user menu, mode CTA, pageVisibility filter, ghost nav on hero pages |
| components/navigation/Footer.jsx                 | Exists — not audited recently                       |
| components/homepage/HeroSection.jsx              | CSS-only slider, pulls banners from API, fallback slides |
| components/homepage/HomeSections.jsx             | All sections, demo fallback data, mode-aware        |
| components/product/ProductCard.jsx               | Full mode-aware B2B/B2C CTAs, wishlist, hover       |
| components/category/CategoryCard.jsx             | Image card with shimmer hover + product count       |
| admin/components/navigation/Sidebar.jsx          | Collapsible via body[data-sidebar]                  |
| admin/components/navigation/Topbar.jsx           | Live site link, logout → /admin/login               |
| admin/components/forms/ProductForm.jsx           | Full: category, images, SEO, B2B/B2C flags, specs   |
| admin/pages/WebsiteBuilder/WebsiteBuilderPage.jsx| 4-tab builder: Content, Sections, Design, Store     |
| admin/components/common/*                        | Button, Input, Select, Textarea, Modal, Switch, Skeleton, PageHeader, SearchInput, FormSection |

---

## CSS Architecture
| File                                  | Scope                                         |
|---------------------------------------|-----------------------------------------------|
| src/styles/site.css                   | Site CSS vars (light+dark), buttons, inputs   |
| src/admin/styles/admin.css            | Admin layout + imports all admin CSS          |
| src/admin/styles/theme.css            | Admin CSS vars                                |
| src/admin/styles/sidebar.css          | Sidebar                                       |
| src/admin/styles/topbar.css           | Topbar                                        |
| src/admin/styles/dashboard.css        | Dashboard grid + widgets                      |
| src/admin/styles/cards.css            | Stat cards                                    |
| src/admin/styles/tables.css           | Tables, badges, pagination                    |
| src/admin/styles/forms.css            | Form groups, buttons, switches, upload zones  |
| src/admin/styles/modal.css            | Modals, confirm dialog, skeleton shimmer      |
| src/admin/pages/WebsiteBuilder/WebsiteBuilderPage.css | Website builder UI              |
| src/pages/Categories/CategoriesPage.css | Categories page                             |
| src/pages/Products/ProductsPage.css   | Product listing page                          |
| src/pages/Product/ProductDetailPage.css | Product detail                              |
| src/pages/Cart/CartPage.css           | Cart                                          |
| src/pages/Checkout/CheckoutPage.css   | Checkout                                      |
| src/components/navigation/Navbar.css  | Navbar                                        |
| src/components/homepage/HeroSection.css | Hero slider                                 |
| src/components/homepage/HomeSections.css | All homepage sections                      |
| src/components/product/ProductCard.css  | Product card                                |
| src/components/category/CategoryCard.css | Category card                              |

---

## Context Providers (main.jsx order)
1. ThemeProvider — dark by default, sets data-theme on html
2. SettingsProvider — fetches + caches settings, drives all dynamic content
3. CartProvider — localStorage cart
4. (UserContext referenced in Navbar — UserProvider location TBC)

---

## Known Issues Fixed
- ✅ Server crash on startup — `userAuthMiddleware.js` was missing
- ✅ `index.js` safe `mount()` wrapper
- ✅ Admin login 401 — server wasn't starting
- ✅ Duplicate trust section on homepage
- ✅ Admin sidebar collapse — `body[data-sidebar]` attribute
- ✅ ProductsPage GSAP crash — removed GSAP entirely
- ✅ Import name collision (CategoriesPage) — aliased with Admin prefix
- ✅ Multer 2 + Express 5 incompatibility — fixed `fileFilter` error passing + `upload.single()` callback pattern
- ✅ Navbar blog link flash on refresh — `SettingsContext` now caches to localStorage; blog/about default to FALSE so they never flash visible then disappear
- ✅ `userAuthMiddleware.js` created — site user JWT validation
- ✅ Added "View Orders" button to desktop actions panel in Navbar.jsx
- ✅ Hidden wishlist and view orders buttons on mobile navbar (added hide-on-mobile class)
- ✅ Fixed header overlapping on orders history, profile, and forgot password pages (increased top padding to 120px on .site-container)

---

## Pending / Next Tasks (Priority Order)
1. 🔲 Header Builder admin page (`/admin/header-builder`)
2. 🔲 Footer Builder admin page (`/admin/footer-builder`)
3. 🔲 Enquiries CRM module (`/admin/enquiries`)
4. 🔲 Banners admin module (`/admin/banners`)
5. 🔲 Blogs CMS module (`/admin/blogs`)
6. 🔲 Coupons module (`/admin/coupons`)
7. 🔲 Media Library (`/admin/media`)
8. 🔲 Settings admin page (`/admin/settings`)
9. 🔲 About + Blog frontend pages
10. 🔲 Login + Register frontend pages (UserContext + userRoutes)
11. 🔲 README + deployment setup

---

## Run Commands
```bash
# Backend
cd apps/AgroNest/server
npm run dev          # nodemon on port 5001

# Seed database
node seed.js         # admin@agronest.in / admin123 + 12 products + 6 categories + 3 banners

# Frontend
cd apps/AgroNest/client
npm run dev          # Vite on port 5173
```

## Environment Variables (`server/.env`)
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/agronest
JWT_SECRET=agronest_super_secret_key_2024
```
