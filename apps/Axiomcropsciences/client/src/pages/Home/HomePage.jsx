import Navbar  from "../../components/navigation/Navbar";
import Footer  from "../../components/navigation/Footer";
import HeroSection from "../../components/homepage/HeroSection";
import {
  FeaturedCategories,
  FeaturedProducts,
  BestSellingProducts,
  NewArrivals,
  SeasonalProducts,
  BrandsSection,
  Testimonials,
  BlogSection,
  Newsletter,
} from "../../components/homepage/HomeSections";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/site.css";

export default function HomePage() {
  const { settings } = useSettings();

  // Section visibility — falls back to true if settings not loaded yet
  const show = (key) => settings?.[key] !== false;

  return (
    <div className="site-root">
      <Navbar />
      <main>
        <HeroSection />
        {show("showFeaturedCategories") && <FeaturedCategories />}
        {show("showFeaturedProducts")   && <FeaturedProducts />}
        {show("showSeasonalBanner")     && <SeasonalProducts />}
        {show("showBestSellers")        && <BestSellingProducts />}
        {show("showBestSellers")        && <NewArrivals />}
        {show("showBrandsSection")      && <BrandsSection />}
        {show("showTestimonials")       && <Testimonials />}
        {show("showBlogSection")        && <BlogSection />}
        {show("showNewsletter")         && <Newsletter />}
      </main>
      <Footer />
    </div>
  );
}
