import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider }        from "@tanstack/react-query";
import { Toaster }                                  from "react-hot-toast";
import { UserProvider }                             from "./context/UserContext";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Admin
import AdminLayout              from "./admin/layouts/AdminLayout";
import AdminDashboard           from "./admin/pages/Dashboard/DashboardPage";
import AdminProducts            from "./admin/pages/Products/ProductsPage";
import AdminProductCreate       from "./admin/pages/Products/ProductCreatePage";
import AdminProductEdit         from "./admin/pages/Products/ProductEditPage";
import AdminCategories          from "./admin/pages/Categories/CategoriesPage";
import AdminOrders              from "./admin/pages/Orders/OrdersPage";
import AdminInventory           from "./admin/pages/Inventory/InventoryPage";
import AdminCollections         from "./admin/pages/Collections/CollectionsPage";
import AdminCustomers           from "./admin/pages/Customers/CustomersPage";
import AdminCoupons             from "./admin/pages/Coupons/CouponsPage";
import AdminEnquiries           from "./admin/pages/Enquiries/EnquiriesPage";
import AdminBanners             from "./admin/pages/Banners/BannersPage";
import AdminBlogs               from "./admin/pages/Blogs/BlogsPage";
import AdminPages               from "./admin/pages/Pages/PagesPage";
import AdminHomepageBuilder     from "./admin/pages/HomepageBuilder/HomepageBuilderPage";
import AdminAboutBuilder        from "./admin/pages/AboutBuilder/AboutBuilderPage";
import AdminWebsiteBuilder      from "./admin/pages/WebsiteBuilder/WebsiteBuilderPage";
import AdminThemeBuilder        from "./admin/pages/ThemeBuilder/ThemeBuilderPage";
import AdminHeaderBuilder       from "./admin/pages/HeaderBuilder/HeaderBuilderPage";
import AdminFooterBuilder       from "./admin/pages/FooterBuilder/FooterBuilderPage";
import AdminSEO                 from "./admin/pages/SEO/SEOPage";
import AdminAnalytics           from "./admin/pages/Analytics/AnalyticsPage";
import AdminMedia               from "./admin/pages/MediaLibrary/MediaLibraryPage";
import AdminUsers               from "./admin/pages/Users/UsersPage";
import AdminRoles               from "./admin/pages/Roles/RolesPage";
import AdminLogs                from "./admin/pages/Logs/LogsPage";
import AdminIntegrations        from "./admin/pages/Integrations/IntegrationsPage";
import AdminSettings            from "./admin/pages/Settings/SettingsPage";

// Frontend site
import AdminLogin               from "./pages/AdminLogin";
import HomePage                 from "./pages/Home/HomePage";
import SiteProductsPage         from "./pages/Products/ProductsPage";
import SiteProductDetail        from "./pages/Product/ProductDetailPage";
import SiteCart                 from "./pages/Cart/CartPage";
import SiteCheckout             from "./pages/Checkout/CheckoutPage";
import SitePaymentPage          from "./pages/Checkout/PaymentPage";
import { OrderSuccessPage }     from "./components/checkout/OrderSuccessModel";
import SiteCategories           from "./pages/Categories/CategoriesPage";
import BlogPage                 from "./pages/Blog/BlogPage";
import BlogPostPage             from "./pages/Blog/BlogPostPage";
import AboutPage                from "./pages/About/AboutPage";
import ContactPage              from "./pages/Contact/ContactPage";
import LoginPage                from "./pages/Account/LoginPage";
import RegisterPage             from "./pages/Account/RegisterPage";
import ProfilePage              from "./pages/Account/ProfilePage";
import OrdersHistoryPage        from "./pages/Account/OrdersHistoryPage";
import ForgotPasswordPage       from "./pages/Account/ForgotPasswordPage";
import DeactivatedPage          from "./pages/Account/DeactivatedPage";
import WishlistPage             from "./pages/Wishlist/WishlistPage";
import PoliciesPage             from "./pages/Policies/PoliciesPage";
import DynamicPage              from "./pages/DynamicPage/DynamicPage";
import CollectionPage           from "./pages/Collection/CollectionPage";
import { useSettings }          from "./context/SettingsContext";

const Stub = ({ title }) => (
  <div className="site-root" style={{
    minHeight: "60vh", display: "flex", alignItems: "center",
    justifyContent: "center", flexDirection: "column", gap: 12,
  }}>
    <h2 style={{ fontFamily: "var(--site-font-display)", fontSize: "2rem" }}>{title}</h2>
    <p style={{ color: "var(--site-text-muted)" }}>Coming soon.</p>
  </div>
);

import { useParams } from "react-router-dom";
const CategoryRedirect = () => {
  const { slug } = useParams();
  const formatCat = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return <Navigate to={`/products?category=${encodeURIComponent(formatCat)}`} replace />;
};

// Redirects to home if the admin has hidden this page via
// Settings → pageVisibility. Prevents direct-URL access to disabled pages.
function PageGate({ pageKey, children }) {
  const { settings, loading } = useSettings();
  if (loading) return null;
  if (settings.pageVisibility?.[pageKey] === false) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <UserProvider>
          <Routes>

            {/* ── Public Frontend ── */}
            <Route path="/"                 element={<HomePage />} />
            <Route path="/products"         element={<PageGate pageKey="shop"><SiteProductsPage /></PageGate>} />
            <Route path="/products/:slug"   element={<PageGate pageKey="shop"><SiteProductDetail /></PageGate>} />
            <Route path="/cart"             element={<SiteCart />} />
            <Route path="/checkout"         element={<SiteCheckout />} />
            <Route path="/checkout/payment" element={<SitePaymentPage />} />
            <Route path="/checkout/success" element={<OrderSuccessPage />} />
            <Route path="/categories"       element={<PageGate pageKey="categories"><SiteCategories /></PageGate>} />
            <Route path="/categories/:slug" element={<CategoryRedirect />} />
            <Route path="/blog"             element={<PageGate pageKey="blog"><BlogPage /></PageGate>} />
            <Route path="/blog/:slug"       element={<PageGate pageKey="blog"><BlogPostPage /></PageGate>} />
            <Route path="/about"            element={<PageGate pageKey="about"><AboutPage /></PageGate>} />
            <Route path="/contact"          element={<PageGate pageKey="contact"><ContactPage /></PageGate>} />
            <Route path="/collections/:key" element={<CollectionPage />} />
            <Route path="/policies/:slug"   element={<PoliciesPage />} />

            {/* ── Auth pages ── */}
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/register"         element={<RegisterPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/account"          element={<ProfilePage />} />
            <Route path="/account/orders"   element={<OrdersHistoryPage />} />
            <Route path="/wishlist"         element={<WishlistPage />} />
            <Route path="/deactivated"      element={<DeactivatedPage />} />

            {/* ── Admin Login — no layout wrapper ── */}
            <Route path="/admin/login"      element={<AdminLogin />} />

            {/* ── Admin Panel ── */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index                      element={<AdminDashboard />} />
              <Route path="products"            element={<AdminProducts />} />
              <Route path="products/create"     element={<AdminProductCreate />} />
              <Route path="products/edit/:id"   element={<AdminProductEdit />} />
              <Route path="categories"          element={<AdminCategories />} />
              <Route path="inventory"           element={<AdminInventory />} />
              <Route path="collections"         element={<AdminCollections />} />
              <Route path="orders"              element={<AdminOrders />} />
              <Route path="customers"           element={<AdminCustomers />} />
              <Route path="coupons"             element={<AdminCoupons />} />
              <Route path="enquiries"           element={<AdminEnquiries />} />
              <Route path="banners"             element={<AdminBanners />} />
              <Route path="blogs"               element={<AdminBlogs />} />
              <Route path="pages"               element={<AdminPages />} />
              <Route path="homepage-builder"    element={<AdminHomepageBuilder />} />
              <Route path="about-builder"       element={<AdminAboutBuilder />} />
              <Route path="website-builder"     element={<AdminWebsiteBuilder />} />
              <Route path="theme-builder"       element={<AdminThemeBuilder />} />
              <Route path="header-builder"      element={<AdminHeaderBuilder />} />
              <Route path="footer-builder"      element={<AdminFooterBuilder />} />
              <Route path="seo"                 element={<AdminSEO />} />
              <Route path="analytics"           element={<AdminAnalytics />} />
              <Route path="media"               element={<AdminMedia />} />
              <Route path="users"               element={<AdminUsers />} />
              <Route path="roles"               element={<AdminRoles />} />
              <Route path="logs"                element={<AdminLogs />} />
              <Route path="integrations"        element={<AdminIntegrations />} />
              <Route path="settings"            element={<AdminSettings />} />
            </Route>

            {/* Custom CMS pages (created in admin → Pages). Static routes above
                always win over this dynamic one in React Router's ranking. */}
            <Route path="/:slug" element={<DynamicPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "var(--card,#171717)",
            color:      "var(--text,#fff)",
            border:     "1px solid var(--border,#262626)",
            borderRadius: 14,
          },
        }}
      />
    </QueryClientProvider>
  );
}
