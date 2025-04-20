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
  clearCart: (showToast?: boolean) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: PizzaItem, quantity = 1, customizations?: any) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => {
        if (customizations && cartItem.id === item.id) {
          return JSON.stringify(cartItem.customizations) === JSON.stringify(customizations);
        }
        return !cartItem.customizations && cartItem.id === item.id;
      });
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        toast.success(`${item.name} atualizado no carrinho!`);
        return updatedCart;
      } else {
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

  const clearCart = (showToast: boolean = true) => {
    setCart([]);
    if (showToast) {
      toast.info('Carrinho limpo');
    }
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
