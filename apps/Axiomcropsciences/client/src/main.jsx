import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider }    from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider }     from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Base reset first — clears Vite's default #root constraints
import "./index.css";
// Site design tokens (CSS vars, fonts, shared utilities)
import "./styles/site.css";
// Admin panel styles (scoped to admin classes + data-theme)
import "./admin/styles/admin.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
);
