
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export interface PaymentInfo {
  method: 'credit' | 'debit' | 'cash' | 'pix';
  change?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  total: number;
  date: string;
  status: OrderStatus;
  userName?: string;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (items: CartItem[], delivery: DeliveryInfo, payment: PaymentInfo, total: number) => Promise<string>;
  getUserOrders: (userId: string) => Order[];
  reorder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  hasNewOrders: boolean;
  clearNewOrdersFlag: () => void;
  getAllOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'pizza-palace-orders';
const NEW_ORDERS_KEY = 'pizza-palace-new-orders';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();

  // Load orders from localStorage on initial render
  useEffect(() => {
    const loadOrders = () => {
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      
      const newOrdersFlag = localStorage.getItem(NEW_ORDERS_KEY);
      setHasNewOrders(newOrdersFlag === 'true');
    };
    
    loadOrders();
    
    // Set up interval to check for new orders more frequently (every 5 seconds)
    const interval = setInterval(loadOrders, 5000);
    
    // Also set up an event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ORDERS_STORAGE_KEY || e.key === NEW_ORDERS_KEY) {
        loadOrders();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save orders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const createOrder = async (
    items: CartItem[], 
    delivery: DeliveryInfo, 
    payment: PaymentInfo,
    total: number
  ): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }

    // Create new order
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: user.id,
      items: [...items],
      delivery,
      payment,
      total,
      date: new Date().toISOString(),
      status: 'pending',
      userName: user.name
    };

    // Update orders
    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    // Set new orders flag for admin notification and dispatch custom event
    localStorage.setItem(NEW_ORDERS_KEY, 'true');
    setHasNewOrders(true);
    
    // Dispatch a custom event that the admin panel can listen for
    const customEvent = new CustomEvent('new-order-created', { detail: newOrder });
    window.dispatchEvent(customEvent);
    
    return newOrder.id;
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    // Sort by date descending (newest first)
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
    
    // Get order details for toast notification
    const order = orders.find(o => o.id === orderId);
    if (order) {
      let statusMessage = '';
      
      switch(status) {
        case 'preparing':
          statusMessage = 'está sendo preparado';
          break;
        case 'delivering':
          statusMessage = 'saiu para entrega';
          break;
        case 'completed':
          statusMessage = 'foi entregue';
          break;
        case 'cancelled':
          statusMessage = 'foi cancelado';
          break;
        default:
          statusMessage = 'foi atualizado';
      }
      
      toast.success(`Pedido #${orderId.split('-')[1]} ${statusMessage}`);
    }
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
      addToCart(item, item.quantity, item.customizations);
    });

    toast.success('Itens adicionados ao carrinho!');
  };

  const clearNewOrdersFlag = () => {
    setHasNewOrders(false);
    localStorage.setItem(NEW_ORDERS_KEY, 'false');
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders,
        createOrder,
        getUserOrders,
        reorder,
        updateOrderStatus,
        hasNewOrders,
        clearNewOrdersFlag,
        getAllOrders
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
