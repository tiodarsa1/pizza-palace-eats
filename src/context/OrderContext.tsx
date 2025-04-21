
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

// New storage keys with timestamps to avoid caching issues
const ORDERS_STORAGE_KEY = 'pizza-palace-orders-v2';
const NEW_ORDERS_KEY = 'pizza-palace-new-orders-v2';
const LAST_SYNC_KEY = 'pizza-palace-last-sync-v2';
const BROADCAST_KEY = 'pizza-palace-order-broadcast-v2';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();
  
  // Use localStorage directly for most reliable cross-browser sync
  const saveOrdersToStorage = useCallback((updatedOrders: Order[]) => {
    try {
      console.log('Saving orders to storage, count:', updatedOrders.length);
      const ordersString = JSON.stringify(updatedOrders);
      localStorage.setItem(ORDERS_STORAGE_KEY, ordersString);
      
      // Force a cookie/session storage update as well for redundancy
      sessionStorage.setItem(ORDERS_STORAGE_KEY, ordersString);
      
      // Force a timestamp update to trigger sync in other tabs
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving orders to storage:', error);
    }
  }, []);

  // Load orders from localStorage with forced reload
  const loadOrders = useCallback(() => {
    try {
      // First try to get from localStorage
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        console.log('Orders loaded from localStorage:', parsedOrders.length);
        setOrders(parsedOrders);
      } else {
        // Fallback to older storage key
        const oldOrders = localStorage.getItem('pizza-palace-orders');
        if (oldOrders) {
          const parsedOldOrders = JSON.parse(oldOrders);
          console.log('Migrating from old storage key, orders:', parsedOldOrders.length);
          setOrders(parsedOldOrders);
          // Save to new key
          localStorage.setItem(ORDERS_STORAGE_KEY, oldOrders);
        }
      }
      
      // Check for new orders flag
      const newOrdersFlag = localStorage.getItem(NEW_ORDERS_KEY) || localStorage.getItem('pizza-palace-new-orders');
      setHasNewOrders(newOrdersFlag === 'true');
      
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
    }
  }, []);

  // Refresh orders manually with heightened priority
  const refreshOrders = useCallback(() => {
    console.log('Manually refreshing orders with high priority');
    
    // Force clear any cached data
    try {
      // First try session storage for this tab
      const sessionData = sessionStorage.getItem(ORDERS_STORAGE_KEY);
      if (sessionData) {
        const parsedOrders = JSON.parse(sessionData);
        console.log('Using session storage data first, orders:', parsedOrders.length);
        setOrders(parsedOrders);
      }
      
      // Then try localStorage
      loadOrders();
      
      // Force a broadcast to other tabs and windows
      broadcastOrderUpdate();
    } catch (e) {
      console.error('Error during high-priority refresh:', e);
      // Fallback to basic reload
      loadOrders();
    }
  }, [loadOrders]);
  
  // Broadcast order updates to all tabs and windows
  const broadcastOrderUpdate = useCallback(() => {
    try {
      // Use both custom event and localStorage to maximize reach
      const timestamp = Date.now();
      
      // 1. Create and dispatch a custom event
      const customEvent = new CustomEvent('orders-updated', { 
        detail: { timestamp } 
      });
      window.dispatchEvent(customEvent);
      console.log('Custom event dispatched for order updates, timestamp:', timestamp);
      
      // 2. Use localStorage to trigger storage events in other tabs
      localStorage.removeItem(BROADCAST_KEY); // Force event even if same value
      localStorage.setItem(BROADCAST_KEY, JSON.stringify({
        type: 'orders-updated',
        timestamp,
        source: 'broadcast'
      }));
      
      // 3. Update last sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      console.log('Order update broadcast completed');
    } catch (e) {
      console.error('Error broadcasting order update:', e);
    }
  }, []);

  // Initialize orders on component mount with stronger initialization
  useEffect(() => {
    console.log('OrderContext initializing');
    
    // Initial load
    loadOrders();
    
    // Set up more frequent polling (every 1.5 seconds) for better real-time feeling
    const pollingInterval = setInterval(() => {
      // Check if we need to reload based on sync timestamp
      try {
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (lastSync) {
          const lastSyncTime = parseInt(lastSync, 10);
          const lastLocalSync = parseInt(sessionStorage.getItem('last-local-sync') || '0', 10);
          
          // If storage was updated after our last check, reload
          if (lastSyncTime > lastLocalSync) {
            console.log('Detected newer data via timestamp, reloading');
            loadOrders();
            sessionStorage.setItem('last-local-sync', lastSyncTime.toString());
          }
        } else {
          // If no sync timestamp found, do a reload anyway (first load scenario)
          loadOrders();
        }
      } catch (e) {
        console.error('Error during polling interval:', e);
      }
    }, 1500);
    
    // Listen for custom events more intensively
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Custom order event received:', customEvent.type, customEvent.detail);
      
      if (customEvent.type === 'orders-updated' || customEvent.type === 'new-order-created') {
        console.log('Reloading orders due to custom event');
        loadOrders();
      }
    };
    
    // Listen for storage changes with improved handling
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage event:', e.key);
      
      if (e.key === ORDERS_STORAGE_KEY || e.key === NEW_ORDERS_KEY || 
          e.key === LAST_SYNC_KEY || e.key === BROADCAST_KEY ||
          e.key === 'pizza-palace-orders' || e.key === 'pizza-palace-new-orders' ||
          e.key === 'pizza-palace-last-sync' || e.key === 'pizza-palace-order-broadcast' ||
          e.key === 'pizza-palace-force-refresh') {
        console.log('Order-related storage changed, reloading orders');
        loadOrders();
        
        // Also update our last sync timestamp
        try {
          const currentTime = Date.now().toString();
          sessionStorage.setItem('last-local-sync', currentTime);
        } catch (error) {
          console.error('Error updating last sync timestamp:', error);
        }
      }
    };
    
    // Set up all event listeners with capture to ensure early handling
    window.addEventListener('orders-updated', handleCustomEvent, { capture: true });
    window.addEventListener('new-order-created', handleCustomEvent, { capture: true });
    window.addEventListener('order-sync-required', handleCustomEvent, { capture: true });
    window.addEventListener('storage', handleStorageChange, { capture: true });
    
    // Force an immediate refresh after a short delay
    setTimeout(refreshOrders, 500);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('orders-updated', handleCustomEvent);
      window.removeEventListener('new-order-created', handleCustomEvent);
      window.removeEventListener('order-sync-required', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadOrders, refreshOrders]);

  // Save orders to localStorage whenever it changes with more reliable approach
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

    // Create new order with timestamp-based ID for uniqueness
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

    // First read current orders directly from storage for most accurate state
    let currentOrders: Order[] = [];
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        currentOrders = JSON.parse(storedOrders);
      }
    } catch (e) {
      console.error('Error reading current orders from storage:', e);
      // Fall back to current state
      currentOrders = [...orders];
    }
    
    // Add new order to the list
    const updatedOrders = [...currentOrders, newOrder];
    
    // Update state and storage directly for immediate effect
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    
    // Set new orders flag for admin notification
    localStorage.setItem(NEW_ORDERS_KEY, 'true');
    setHasNewOrders(true);
    
    // Broadcast with multiple methods for maximum reliability
    try {
      // 1. Direct dispatch custom event
      const customEvent = new CustomEvent('new-order-created', { 
        detail: { order: newOrder, timestamp } 
      });
      window.dispatchEvent(customEvent);
      console.log('Custom event dispatched for new order:', newOrder.id);
      
      // 2. Use localStorage for cross-tab communication
      localStorage.removeItem(BROADCAST_KEY);
      localStorage.setItem(BROADCAST_KEY, JSON.stringify({
        type: 'new-order',
        orderId: newOrder.id,
        timestamp,
        source: 'order-creation'
      }));
      
      // 3. Set additional flags for redundancy
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      localStorage.setItem('pizza-palace-force-refresh', timestamp.toString());
      
      // 4. Also set old keys for backward compatibility
      localStorage.setItem('pizza-palace-new-orders', 'true');
      localStorage.setItem('pizza-palace-order-broadcast', JSON.stringify({
        type: 'new-order',
        orderId: newOrder.id,
        timestamp
      }));
      
      console.log('New order broadcast completed with all methods');
      
      // 5. Force another sync event after a short delay for reliability
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
    // First read current orders directly from storage for most accurate state
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
    
    // Update the order status
    const updatedOrders = currentOrders.map(order => 
      order.id === orderId ? { ...order, status } : order
    );
    
    // Update state and storage
    setOrders(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    
    // Broadcast the update
    broadcastOrderUpdate();
    
    // Get order details for toast notification
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
    // Also clear old key for compatibility
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
