
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

const ORDERS_STORAGE_KEY = 'pizza-palace-orders-v3';
const NEW_ORDERS_KEY = 'pizza-palace-new-orders-v3';
const SYNC_KEY = 'pizza-palace-sync-v3';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();
  
  // Função para salvar pedidos com sincronização cruzada
  const saveOrdersWithSync = useCallback((updatedOrders: Order[]) => {
    try {
      const timestamp = Date.now();
      const ordersString = JSON.stringify(updatedOrders);
      
      // Salvar em múltiplos storages para máxima compatibilidade
      localStorage.setItem(ORDERS_STORAGE_KEY, ordersString);
      localStorage.setItem('pizza-palace-orders-v2', ordersString);
      localStorage.setItem('pizza-palace-orders', ordersString);
      
      // Atualizar timestamp de sincronização
      localStorage.setItem(SYNC_KEY, timestamp.toString());
      localStorage.setItem('pizza-palace-last-sync-v2', timestamp.toString());
      localStorage.setItem('pizza-palace-last-sync', timestamp.toString());
      
      setLastSyncTime(timestamp);
      
      console.log('Orders saved with cross-device sync:', updatedOrders.length);
    } catch (error) {
      console.error('Error saving orders with sync:', error);
    }
  }, []);

  // Função para carregar pedidos de qualquer storage disponível
  const loadOrdersFromAnyStorage = useCallback(() => {
    try {
      const storageKeys = [ORDERS_STORAGE_KEY, 'pizza-palace-orders-v2', 'pizza-palace-orders'];
      
      for (const key of storageKeys) {
        const savedOrders = localStorage.getItem(key);
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          if (Array.isArray(parsedOrders) && parsedOrders.length >= 0) {
            console.log(`Orders loaded from ${key}:`, parsedOrders.length);
            setOrders(parsedOrders);
            
            // Se carregou de um storage antigo, migra para o novo
            if (key !== ORDERS_STORAGE_KEY) {
              localStorage.setItem(ORDERS_STORAGE_KEY, savedOrders);
            }
            
            return parsedOrders;
          }
        }
      }
      
      console.log('No orders found in any storage');
      setOrders([]);
      return [];
    } catch (error) {
      console.error('Error loading orders from storage:', error);
      setOrders([]);
      return [];
    }
  }, []);

  // Função para verificar sincronização entre dispositivos
  const checkForUpdates = useCallback(() => {
    try {
      const syncKeys = [SYNC_KEY, 'pizza-palace-last-sync-v2', 'pizza-palace-last-sync'];
      let latestSync = 0;
      
      for (const key of syncKeys) {
        const syncTime = localStorage.getItem(key);
        if (syncTime) {
          const time = parseInt(syncTime, 10);
          if (time > latestSync) {
            latestSync = time;
          }
        }
      }
      
      if (latestSync > lastSyncTime) {
        console.log('Newer data detected, refreshing orders');
        loadOrdersFromAnyStorage();
        setLastSyncTime(latestSync);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }, [lastSyncTime, loadOrdersFromAnyStorage]);

  const refreshOrders = useCallback(() => {
    console.log('Manual refresh triggered');
    loadOrdersFromAnyStorage();
    
    // Verificar flags de novos pedidos
    const newOrdersFlags = [NEW_ORDERS_KEY, 'pizza-palace-new-orders-v2', 'pizza-palace-new-orders'];
    for (const flag of newOrdersFlags) {
      if (localStorage.getItem(flag) === 'true') {
        setHasNewOrders(true);
        break;
      }
    }
  }, [loadOrdersFromAnyStorage]);

  // Inicialização e polling
  useEffect(() => {
    console.log('OrderContext initializing with cross-device sync');
    
    // Carregamento inicial
    loadOrdersFromAnyStorage();
    
    // Verificar flags de novos pedidos
    const newOrdersFlags = [NEW_ORDERS_KEY, 'pizza-palace-new-orders-v2', 'pizza-palace-new-orders'];
    for (const flag of newOrdersFlags) {
      if (localStorage.getItem(flag) === 'true') {
        setHasNewOrders(true);
        break;
      }
    }
    
    // Polling mais agressivo para sincronização
    const pollingInterval = setInterval(() => {
      checkForUpdates();
    }, 1000); // Verifica a cada 1 segundo
    
    // Event listeners para mudanças de storage
    const handleStorageChange = (e: StorageEvent) => {
      const orderKeys = [
        ORDERS_STORAGE_KEY, 'pizza-palace-orders-v2', 'pizza-palace-orders',
        NEW_ORDERS_KEY, 'pizza-palace-new-orders-v2', 'pizza-palace-new-orders',
        SYNC_KEY, 'pizza-palace-last-sync-v2', 'pizza-palace-last-sync',
        'pizza-palace-order-broadcast-v2', 'pizza-palace-order-broadcast'
      ];
      
      if (orderKeys.includes(e.key || '')) {
        console.log('Storage changed, refreshing:', e.key);
        setTimeout(() => {
          loadOrdersFromAnyStorage();
          
          // Verificar novos pedidos
          if (e.key?.includes('new-orders') && e.newValue === 'true') {
            setHasNewOrders(true);
          }
        }, 100);
      }
    };
    
    // Event listeners customizados
    const handleCustomEvents = () => {
      console.log('Custom order event received, refreshing');
      setTimeout(loadOrdersFromAnyStorage, 100);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('new-order-created', handleCustomEvents);
    window.addEventListener('orders-updated', handleCustomEvents);
    window.addEventListener('order-sync-required', handleCustomEvents);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('new-order-created', handleCustomEvents);
      window.removeEventListener('orders-updated', handleCustomEvents);
      window.removeEventListener('order-sync-required', handleCustomEvents);
    };
  }, [loadOrdersFromAnyStorage, checkForUpdates]);

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

    // Carregar pedidos atuais de qualquer storage
    const currentOrders = loadOrdersFromAnyStorage();
    const updatedOrders = [...currentOrders, newOrder];
    
    // Salvar com sincronização
    setOrders(updatedOrders);
    saveOrdersWithSync(updatedOrders);
    
    // Definir flags de novos pedidos em todos os storages
    const newOrderFlags = [NEW_ORDERS_KEY, 'pizza-palace-new-orders-v2', 'pizza-palace-new-orders'];
    newOrderFlags.forEach(flag => localStorage.setItem(flag, 'true'));
    setHasNewOrders(true);
    
    // Broadcast para outros dispositivos/abas
    try {
      const broadcastData = {
        type: 'new-order',
        orderId: newOrder.id,
        timestamp,
        orders: updatedOrders
      };
      
      localStorage.setItem('pizza-palace-order-broadcast-v2', JSON.stringify(broadcastData));
      localStorage.setItem('pizza-palace-order-broadcast', JSON.stringify(broadcastData));
      
      // Eventos customizados
      window.dispatchEvent(new CustomEvent('new-order-created', { detail: broadcastData }));
      window.dispatchEvent(new CustomEvent('orders-updated', { detail: broadcastData }));
      
      console.log('Order created and broadcasted:', newOrder.id);
    } catch (e) {
      console.error('Error broadcasting new order:', e);
    }
    
    return newOrder.id;
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    // Sempre retorna a versão mais atualizada dos pedidos
    const currentOrders = loadOrdersFromAnyStorage();
    return [...currentOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loadOrdersFromAnyStorage]);

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
        addToCart(item, item.quantity);
      }, index * 50);
    });
    
    setTimeout(() => {
      toast.success('Itens adicionados ao carrinho');
    }, orderToReuse.items.length * 50 + 100);
  }, [orders, clearCart, addToCart]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const currentOrders = loadOrdersFromAnyStorage();
    const updatedOrders = currentOrders.map(order => 
      order.id === orderId ? { ...order, status } : order
    );
    
    setOrders(updatedOrders);
    saveOrdersWithSync(updatedOrders);
    
    // Broadcast da atualização
    try {
      const broadcastData = {
        type: 'order-status-updated',
        orderId,
        status,
        timestamp: Date.now(),
        orders: updatedOrders
      };
      
      localStorage.setItem('pizza-palace-order-broadcast-v2', JSON.stringify(broadcastData));
      window.dispatchEvent(new CustomEvent('orders-updated', { detail: broadcastData }));
    } catch (e) {
      console.error('Error broadcasting status update:', e);
    }
    
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
    const flags = [NEW_ORDERS_KEY, 'pizza-palace-new-orders-v2', 'pizza-palace-new-orders'];
    flags.forEach(flag => localStorage.setItem(flag, 'false'));
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
