
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PizzaItem, allProducts } from '@/data/pizzaData';

export interface CartItem extends PizzaItem {
  quantity: number;
  customizations?: {
    excludedIngredients?: string[];
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: PizzaItem, quantity?: number, customizations?: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: PizzaItem, quantity = 1, customizations?: any) => {
    setCart(prevCart => {
      // For items with customizations, we need to check if the same item with the same
      // customizations already exists
      const existingItemIndex = prevCart.findIndex(cartItem => {
        // If we have customizations, we need to check if they match
        if (customizations && cartItem.id === item.id) {
          // Convert to JSON to do a deep comparison of the customizations
          return JSON.stringify(cartItem.customizations) === JSON.stringify(customizations);
        }
        // If no customizations, just check the id
        return !cartItem.customizations && cartItem.id === item.id;
      });
      
      if (existingItemIndex >= 0) {
        // Item exists with the same customizations, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        toast.success(`${item.name} atualizado no carrinho!`);
        return updatedCart;
      } else {
        // Item doesn't exist or has different customizations, add new item
        toast.success(`${item.name} adicionado ao carrinho!`);
        return [...prevCart, { ...item, quantity, customizations }];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === id);
      const updatedCart = prevCart.filter(item => item.id !== id);
      
      if (item) {
        toast.info(`${item.name} removido do carrinho`);
      }
      
      return updatedCart;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Carrinho limpo');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
