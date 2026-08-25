import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

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

  // Total price
  const getCartTotal = () =>
    cart.reduce((sum, i) => {
      if (i.is_wholesale) {
        const size = i.packSize || i.wholesale_qty || 5;
        const wholesalePrice = (i.wholesale_price && !i.packSize) ? i.wholesale_price : (i.price_per_kg * size);
        return sum + (wholesalePrice * i.qty);
      }
      return sum + ((i.retail_price || i.price_per_kg || 0) * i.qty);
    }, 0);

  // Total items in cart
  const getCartCount = () => cart.reduce((sum, i) => sum + i.qty, 0);

  // Total kg/units in cart
  const getCartKg = () => 
    cart.reduce((sum, i) => {
      if (i.is_wholesale) {
         return sum + ((i.packSize || i.wholesale_qty || 5) * i.qty);
      }
      return sum + i.qty;
    }, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQuantity, removeFromCart, clearCart,
      getCartTotal, getCartCount, getCartKg
    }}>
      {children}
    </CartContext.Provider>
  );
};
