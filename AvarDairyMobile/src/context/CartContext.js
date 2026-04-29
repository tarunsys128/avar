import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, weight, blocks) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.id === product.id && item.weight === weight
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prev];
        newCart[existingItemIndex].blocks += blocks;
        newCart[existingItemIndex].total = 
          newCart[existingItemIndex].price_per_kg * newCart[existingItemIndex].weight * newCart[existingItemIndex].blocks;
        return newCart;
      } else {
        const total = product.price_per_kg * weight * blocks;
        return [...prev, { ...product, weight, blocks, total }];
      }
    });
  };

  const removeFromCart = (id, weight) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.weight === weight)));
  };

  const updateBlocks = (id, weight, newBlocks) => {
    if (newBlocks <= 0) {
      removeFromCart(id, weight);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id && item.weight === weight) {
          return {
            ...item,
            blocks: newBlocks,
            total: item.price_per_kg * item.weight * newBlocks
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.total, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateBlocks,
    clearCart,
    getCartTotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
