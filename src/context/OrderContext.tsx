
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
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'pizza-palace-orders';
const NEW_ORDERS_KEY = 'pizza-palace-new-orders';
const LAST_SYNC_KEY = 'pizza-palace-last-sync';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();

  // Load orders from localStorage on initial render and on refresh
  const loadOrders = useCallback(() => {
    try {
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
        console.log('Orders loaded from localStorage:', JSON.parse(savedOrders).length);
      }
      
      const newOrdersFlag = localStorage.getItem(NEW_ORDERS_KEY);
      setHasNewOrders(newOrdersFlag === 'true');
      
      // Save last sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
    }
  }, []);

  // Refresh orders manually
  const refreshOrders = useCallback(() => {
    console.log('Manually refreshing orders');
    loadOrders();
  }, [loadOrders]);

  // Initialize orders on component mount
  useEffect(() => {
    loadOrders();
    
    // Set up interval to check for new orders more frequently (every 2 seconds)
    const interval = setInterval(loadOrders, 2000);
    
    // Also set up an event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ORDERS_STORAGE_KEY || e.key === NEW_ORDERS_KEY) {
        console.log('Storage changed for key:', e.key);
        loadOrders();
      }
    };
    
    // Custom event listener for new orders
    const handleNewOrderEvent = () => {
      console.log('New order event received');
      loadOrders();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('new-order-created', handleNewOrderEvent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('new-order-created', handleNewOrderEvent);
    };
  }, [loadOrders]);

  // Save orders to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      console.log('Orders saved to localStorage:', orders.length);
    } catch (error) {
      console.error('Error saving orders to localStorage:', error);
    }
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
      userName: user.name // Ensure user name is always saved to the order
    };

    // Update orders
    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    // Set new orders flag for admin notification
    localStorage.setItem(NEW_ORDERS_KEY, 'true');
    setHasNewOrders(true);
    
    try {
      // Broadcast to all tabs and browsers using multiple methods
      
      // 1. Create and dispatch a custom event
      const customEvent = new CustomEvent('new-order-created', { detail: newOrder });
      window.dispatchEvent(customEvent);
      console.log('Custom event dispatched for new order:', newOrder.id);
      
      // 2. Use localStorage to trigger storage events in other tabs
      // First remove the key (if it exists) to ensure the event fires even if the same value is set
      localStorage.removeItem('pizza-palace-order-broadcast');
      // Then set it with the timestamp to guarantee uniqueness
      localStorage.setItem('pizza-palace-order-broadcast', JSON.stringify({
        type: 'new-order',
        timestamp: Date.now(),
        orderId: newOrder.id
      }));
      console.log('Broadcast localStorage event triggered');
      
      // 3. Force all tabs to reload their orders by updating the sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (e) {
      console.error('Error broadcasting new order event:', e);
    }
    
    return newOrder.id;
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    // Reload from localStorage to ensure we have the latest data
    const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    let allOrders = orders;
    
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        // Only update if we got valid orders
        if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
          allOrders = parsedOrders;
          // Update state if we found different orders
          if (JSON.stringify(parsedOrders) !== JSON.stringify(orders)) {
            console.log('Found different orders in localStorage, updating state');
            setOrders(parsedOrders);
          }
        }
      } catch (error) {
        console.error('Error parsing orders from localStorage:', error);
      }
    }
    
    // Sort by date descending (newest first)
    return [...allOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        getAllOrders,
        refreshOrders
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
