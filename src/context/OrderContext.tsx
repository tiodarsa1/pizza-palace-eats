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

const ORDERS_STORAGE_KEY = 'pizza-palace-orders-v2';
const NEW_ORDERS_KEY = 'pizza-palace-new-orders-v2';
const LAST_SYNC_KEY = 'pizza-palace-last-sync-v2';
const BROADCAST_KEY = 'pizza-palace-order-broadcast-v2';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();
  
  const saveOrdersToStorage = useCallback((updatedOrders: Order[]) => {
    try {
      console.log('Saving orders to storage, count:', updatedOrders.length);
      const ordersString = JSON.stringify(updatedOrders);
      localStorage.setItem(ORDERS_STORAGE_KEY, ordersString);
      
      sessionStorage.setItem(ORDERS_STORAGE_KEY, ordersString);
      
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving orders to storage:', error);
    }
  }, []);

  const loadOrders = useCallback(() => {
    try {
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        console.log('Orders loaded from localStorage:', parsedOrders.length);
        setOrders(parsedOrders);
      } else {
        const oldOrders = localStorage.getItem('pizza-palace-orders');
        if (oldOrders) {
          const parsedOldOrders = JSON.parse(oldOrders);
          console.log('Migrating from old storage key, orders:', parsedOldOrders.length);
          setOrders(parsedOldOrders);
          localStorage.setItem(ORDERS_STORAGE_KEY, oldOrders);
        }
      }
      
      const newOrdersFlag = localStorage.getItem(NEW_ORDERS_KEY) || localStorage.getItem('pizza-palace-new-orders');
      setHasNewOrders(newOrdersFlag === 'true');
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
    }
  }, []);

  const refreshOrders = useCallback(() => {
    console.log('Manually refreshing orders with high priority');
    
    try {
      const sessionData = sessionStorage.getItem(ORDERS_STORAGE_KEY);
      if (sessionData) {
        const parsedOrders = JSON.parse(sessionData);
        console.log('Using session storage data first, orders:', parsedOrders.length);
        setOrders(parsedOrders);
      }
      
      loadOrders();
      
      broadcastOrderUpdate();
    } catch (e) {
      console.error('Error during high-priority refresh:', e);
      loadOrders();
    }
  }, [loadOrders]);

  const broadcastOrderUpdate = useCallback(() => {
    try {
      const timestamp = Date.now();
      
      const customEvent = new CustomEvent('orders-updated', { 
        detail: { timestamp } 
      });
      window.dispatchEvent(customEvent);
      console.log('Custom event dispatched for order updates, timestamp:', timestamp);
      
      localStorage.removeItem(BROADCAST_KEY);
      localStorage.setItem(BROADCAST_KEY, JSON.stringify({
        type: 'orders-updated',
        timestamp,
        source: 'broadcast'
      }));
      
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      console.log('Order update broadcast completed');
    } catch (e) {
      console.error('Error broadcasting order update:', e);
    }
  }, []);

  useEffect(() => {
    console.log('OrderContext initializing');
    
    loadOrders();
    
    const pollingInterval = setInterval(() => {
      try {
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (lastSync) {
          const lastSyncTime = parseInt(lastSync, 10);
          const lastLocalSync = parseInt(sessionStorage.getItem('last-local-sync') || '0', 10);
          
          if (lastSyncTime > lastLocalSync) {
            console.log('Detected newer data via timestamp, reloading');
            loadOrders();
            sessionStorage.setItem('last-local-sync', lastSyncTime.toString());
          }
        } else {
          loadOrders();
        }
      } catch (e) {
        console.error('Error during polling interval:', e);
      }
    }, 1500);
    
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Custom order event received:', customEvent.type, customEvent.detail);
      
      if (customEvent.type === 'orders-updated' || customEvent.type === 'new-order-created') {
        console.log('Reloading orders due to custom event');
        loadOrders();
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage event:', e.key);
      
      if (e.key === ORDERS_STORAGE_KEY || e.key === NEW_ORDERS_KEY || 
          e.key === LAST_SYNC_KEY || e.key === BROADCAST_KEY ||
          e.key === 'pizza-palace-orders' || e.key === 'pizza-palace-new-orders' ||
          e.key === 'pizza-palace-last-sync' || e.key === 'pizza-palace-order-broadcast' ||
          e.key === 'pizza-palace-force-refresh') {
        console.log('Order-related storage changed, reloading orders');
        loadOrders();
        
        try {
          const currentTime = Date.now().toString();
          sessionStorage.setItem('last-local-sync', currentTime);
        } catch (error) {
          console.error('Error updating last sync timestamp:', error);
        }
      }
    };
    
    window.addEventListener('orders-updated', handleCustomEvent, { capture: true });
    window.addEventListener('new-order-created', handleCustomEvent, { capture: true });
    window.addEventListener('order-sync-required', handleCustomEvent, { capture: true });
    window.addEventListener('storage', handleStorageChange, { capture: true });
    
    setTimeout(refreshOrders, 500);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('orders-updated', handleCustomEvent);
      window.removeEventListener('new-order-created', handleCustomEvent);
      window.removeEventListener('order-sync-required', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadOrders, refreshOrders]);

  useEffect(() => {
    if (orders.length > 0) {
      console.log('Orders changed, saving to storage:', orders.length);
      saveOrdersToStorage(orders);
    }
  }, [orders, saveOrdersToStorage]);

  const createOrder = async (
    items: CartItem[], 
    delivery: DeliveryInfo, 
    payment: PaymentInfo,
    total: number
  ): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }

    const timestamp = Date.now();
    const newOrder: Order = {
      id: `order-${timestamp}`,
      userId: user.id,
      items: [...items],
      delivery,
      payment,
      total,
      date: new Date().toISOString(),
      status: 'pending',
      userName: user.name
    };

    let currentOrders: Order[] = [];
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        currentOrders = JSON.parse(storedOrders);
      }
    } catch (e) {
      console.error('Error reading current orders from storage:', e);
      currentOrders = [...orders];
    }
    
    const updatedOrders = [...currentOrders, newOrder];
    
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    
    localStorage.setItem(NEW_ORDERS_KEY, 'true');
    setHasNewOrders(true);
    
    try {
      const customEvent = new CustomEvent('new-order-created', { 
        detail: { order: newOrder, timestamp } 
      });
      window.dispatchEvent(customEvent);
      console.log('Custom event dispatched for new order:', newOrder.id);
      
      localStorage.removeItem(BROADCAST_KEY);
      localStorage.setItem(BROADCAST_KEY, JSON.stringify({
        type: 'new-order',
        orderId: newOrder.id,
        timestamp,
        source: 'order-creation'
      }));
      
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      localStorage.setItem('pizza-palace-force-refresh', timestamp.toString());
      
      localStorage.setItem('pizza-palace-new-orders', 'true');
      localStorage.setItem('pizza-palace-order-broadcast', JSON.stringify({
        type: 'new-order',
        orderId: newOrder.id,
        timestamp
      }));
      
      console.log('New order broadcast completed with all methods');
      
      setTimeout(() => {
        try {
          const syncEvent = new CustomEvent('order-sync-required', { 
            detail: { timestamp: Date.now() } 
          });
          window.dispatchEvent(syncEvent);
          console.log('Delayed sync event dispatched');
        } catch (e) {
          console.error('Error dispatching delayed sync event:', e);
        }
      }, 500);
    } catch (e) {
      console.error('Error broadcasting new order:', e);
    }
    
    return newOrder.id;
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    let savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    let allOrders = orders;
    
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
          allOrders = parsedOrders;
          if (JSON.stringify(parsedOrders) !== JSON.stringify(orders)) {
            console.log('Found different orders in localStorage, updating state');
            setOrders(parsedOrders);
          }
        }
      } catch (error) {
        console.error('Error parsing orders from localStorage:', error);
      }
    }
    
    return [...allOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const reorder = useCallback((orderId: string) => {
    console.log('Reordering items from order:', orderId);
    
    const orderToReuse = orders.find(order => order.id === orderId);
    if (!orderToReuse) {
      toast.error('Pedido não encontrado');
      return;
    }
    
    clearCart(false);
    
    orderToReuse.items.forEach((item, index) => {
      setTimeout(() => {
        addToCart(item, false);
      }, index * 50);
    });
    
    setTimeout(() => {
      toast.success('Itens adicionados ao carrinho');
    }, orderToReuse.items.length * 50 + 100);
  }, [orders, clearCart, addToCart]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let currentOrders: Order[] = [];
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        currentOrders = JSON.parse(storedOrders);
      } else {
        currentOrders = [...orders];
      }
    } catch (e) {
      console.error('Error reading current orders during status update:', e);
      currentOrders = [...orders];
    }
    
    const updatedOrders = currentOrders.map(order => 
      order.id === orderId ? { ...order, status } : order
    );
    
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    
    broadcastOrderUpdate();
    
    const order = currentOrders.find(o => o.id === orderId);
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

  const clearNewOrdersFlag = () => {
    setHasNewOrders(false);
    localStorage.setItem(NEW_ORDERS_KEY, 'false');
    localStorage.setItem('pizza-palace-new-orders', 'false');
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
