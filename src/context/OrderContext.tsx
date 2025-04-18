
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CartItem, useCart } from './CartContext';
import { useAuth, User } from './AuthContext';

export interface DeliveryInfo {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  delivery: DeliveryInfo;
  total: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface OrderContextType {
  orders: Order[];
  createOrder: (items: CartItem[], delivery: DeliveryInfo, total: number) => Promise<string>;
  getUserOrders: (userId: string) => Order[];
  reorder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'pizza-palace-orders';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();

  // Load orders from localStorage on initial render
  useEffect(() => {
    const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save orders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const createOrder = async (items: CartItem[], delivery: DeliveryInfo, total: number): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }

    // Create new order
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: user.id,
      items: [...items],
      delivery,
      total,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Update orders
    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    return newOrder.id;
  };

  const getUserOrders = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  };

  const reorder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      toast.error('Pedido não encontrado');
      return;
    }

    // Clear current cart and add items from the order
    clearCart();
    
    // Add each item to cart
    order.items.forEach(item => {
      addToCart(item, item.quantity);
    });

    toast.success('Itens adicionados ao carrinho!');
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders,
        createOrder,
        getUserOrders,
        reorder
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
