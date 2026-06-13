# 🌿 AgroNest — Modern Agribusiness MERN Platform

Welcome to **AgroNest**, a premium, full-stack B2B and Retail Agribusiness platform. Designed to empower farmers, suppliers, and distributors, AgroNest provides a comprehensive marketplace with a powerful site builder, advanced admin dashboard, secure payments, and dynamic retail/wholesale toggle systems.

This repository is structured as a multi-app monorepo, with **AgroNest** as the primary active project containing a decoupled React client and Express server.

---

## 📁 Repository Structure

```text
Internship-Project/
├── apps/
│   ├── AgroNest/            # 🌿 Primary Active Project
│   │   ├── client/          # Vite + React (SPA Frontend & Admin Panel)
│   │   └── server/          # Express + Node.js (Mongoose / MongoDB API Backend)
│   │
│   ├── Zenwell/             # Prototype / Sister project
│   └── Test-project/        # Scaffold / Prototype sandbox
└── docs/                    # Documentation and audit logs
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Custom CSS Design System |
| **State Management** | Zustand 5 (Admin Panels), React Context (Auth, Cart, Wishlist, Themes, Settings) |
| **Data Fetching** | TanStack Query v5 (React Query) |
| **Animations** | GSAP 3 + ScrollTrigger, Framer Motion |
| **Charts & Analytics** | Recharts 3 |
| **Forms & Validation** | React Hook Form, Zod v4 |
| **Rich Text Editor** | TipTap v3 |
| **Backend** | Express 5, Mongoose 9, Node.js |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Integrations** | Razorpay Client SDK, PhonePe Sandbox, Cloudinary, SMTP |

---

## 🚀 Key Features

### 1. 👥 Dual-Store Mode (B2B Wholesale vs. Retail)
* **Instant Mode Switching**: Switch the entire store between B2B and Retail modes with a single toggle in the Admin panel.
* **Dynamic Background Polling**: The frontend utilizes a 10-second polling mechanism that automatically updates user navigation, prices, shopping cart layouts, and checkout flows without needing a page refresh.
* **B2B Enhancements**: Displays minimum order quantities (MOQ), origin data, HSN codes, and disables retail-only badges and components.

### 2. 🏗️ Premium Website & Layout Builders
* **Live Website Builder**: Configure homepage sections (Hero banner settings, announcement bars, CTA prompts, statistics values) dynamically.
* **Dynamic Color & Typography**: Live configuration of HSL color themes and Google Fonts typography across the storefront.
* **Header & Footer Builders**: Dynamically arrange navbar and footer links, copyright notices, and social handles, detaching footer constraints from standard styles.

### 3. 📊 Full-Featured Admin Panel (23 Pages)
* **Analytics Dashboard**: Interactive Recharts visualizations tracking Revenue Trends, Daily Orders, Order Status breakdown, and Top Selling products.
* **Order & Inventory Management**: Full lifecycle management of orders, custom tags, status updates, and interactive product creators.
* **Customers Directory**: Manage active/inactive client profiles, toggle soft-deactivation (denying server access to suspended accounts), and track customer metrics.
* **SEO Center**: Manage General Meta SEO tags, Open Graph tags (social sharing), JSON-LD structured business schema, sitemaps, and third-party trackers (Google Analytics, Facebook Pixel, Hotjar).
* **Coupons Center**: Generate flat, percentage, or free shipping coupons with validation checks (minimum order amounts, expiry gates, usage limits).
* **Activity Logs Tracker**: Real-time audit trail displaying administrative actions (CREATE, UPDATE, DELETE) with fallback mechanisms.
* **Role-Based Access Control**: Supports roles (`super_admin`, `admin`, `editor`, `viewer`, `support`) with strict frontend and backend middleware checks (e.g., read-only access for `viewers`).

### 4. 💳 Secure Checkout & Payment Gateways
* Decoupled server-based payment confirmation updates (`PUT /api/orders/:id/pay`).
* Custom payment interface integrating the live **Razorpay** client SDK and a mock simulated gateway for **PhonePe** QR scanning / UPI transfers.

### 5. ✨ Modern User Experience & Design
* Modern CSS design system leveraging premium HSL color tokens and dark/light palettes.
* Staggered GSAP scroll-triggered animations on the About Us page, featuring counter components that count up as they enter the viewport.
* Navigational skeleton loaders that prevent flickering during auth state checks.

---

## 🔧 Getting Started

### Prerequisites
* **Node.js** (v18+)
* **MongoDB** (Local instance or Atlas URI)

---

### Backend Setup (`apps/AgroNest/server/`)

1. Navigate to the server folder:
   ```bash
   cd apps/AgroNest/server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Environment Variables by creating a `.env` file (see `.env.example`):
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27001/agronest
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Seed the database with product information and the admin account:
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5001`)*

---

### Frontend Setup (`apps/AgroNest/client/`)

1. Navigate to the client folder:
   ```bash
   cd apps/AgroNest/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure API base URL in `.env` if necessary (defaults to `http://localhost:5001` via `axios.js`):
   ```env
   VITE_API_URL=http://localhost:5001
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5173` or next available port)*

---

## 🤝 Contributing & Audits

Refer to `docs/` or the internal [Project Audit](apps/Agronest_audit.md) file for an architectural overview of all endpoints, state schemas, and database schema mappings.
