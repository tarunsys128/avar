import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();
const CARTON_KG = 5; // 1 carton = 5 kg

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Add a product (qty = 1 carton by default)
  const addToCart = (product, cartons = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + cartons } : i);
      }
      return [...prev, { ...product, qty: cartons }];
    });
  };

  // Set exact carton quantity
  const updateQuantity = (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => setCart([]);

  // Total = sum of (price_per_kg × CARTON_KG × cartons)
  const getCartTotal = () =>
    cart.reduce((sum, i) => sum + (i.price_per_kg * CARTON_KG * i.qty), 0);

  // Total cartons in cart
  const getCartCount = () => cart.reduce((sum, i) => sum + i.qty, 0);

  // Total kg in cart
  const getCartKg = () => cart.reduce((sum, i) => sum + (i.qty * CARTON_KG), 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQuantity, removeFromCart, clearCart,
      getCartTotal, getCartCount, getCartKg, CARTON_KG,
    }}>
      {children}
    </CartContext.Provider>
  );
};
