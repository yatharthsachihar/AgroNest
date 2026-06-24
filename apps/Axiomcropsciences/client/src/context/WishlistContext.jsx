import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("axiomcropsciences_wishlist")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("axiomcropsciences_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist    = (product) => setWishlist(prev => prev.find(i => i._id === product._id) ? prev : [...prev, product]);
  const removeFromWishlist = (id)    => setWishlist(prev => prev.filter(i => i._id !== id));
  const isWishlisted     = (id)      => wishlist.some(i => i._id === id);
  const toggleWishlist   = (product) => isWishlisted(product._id) ? removeFromWishlist(product._id) : addToWishlist(product);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isWishlisted, toggleWishlist, totalItems: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
