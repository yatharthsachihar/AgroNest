import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("axiomcropsciences_cart")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("axiomcropsciences_cart", JSON.stringify(cart));
  }, [cart]);

  // Each cart line is keyed by parent product + variation, so two different
  // variations of the same product (e.g. 250g vs 500g) are separate lines and
  // never collide. `productId` is what gets sent to the order API; older carts
  // saved with just `_id` still work via the fallbacks below.
  const lineKey = (i) => i.cartKey || `${i.productId || i._id}:${i.variationId || 'base'}`;

  const addToCart = (item, qty = 1) => {
    const productId   = item.productId || item._id;
    const variationId = item.variationId || null;
    const cartKey     = `${productId}:${variationId || 'base'}`;
    setCart(prev => {
      const exists = prev.find(i => lineKey(i) === cartKey);
      if (exists) return prev.map(i => lineKey(i) === cartKey ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, productId, variationId, cartKey, qty }];
    });
  };

  const removeFromCart = (key) => setCart(prev => prev.filter(i => lineKey(i) !== key));

  const updateQty = (key, qty) => {
    if (qty < 1) return removeFromCart(key);
    setCart(prev => prev.map(i => lineKey(i) === key ? { ...i, qty } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems    = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmount   = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalAmount, lineKey }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
