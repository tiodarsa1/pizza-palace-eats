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

export type OrderStatus = 'pendente' | 'em preparação' | 'saiu para entrega' | 'entregue' | 'cancelled';

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
    
    const interval = setInterval(loadOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: user.id,
      items: [...items],
      delivery,
      payment,
      total,
      date: new Date().toISOString(),
      status: 'pendente',
      userName: user.name
    };

    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    localStorage.setItem(NEW_ORDERS_KEY, 'true');
    setHasNewOrders(true);
    
    return newOrder.id;
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
    
    const order = orders.find(o => o.id === orderId);
    if (order) {
      let statusMessage = '';
      
      switch(status) {
        case 'em preparação':
          statusMessage = 'está sendo preparado';
          break;
        case 'saiu para entrega':
          statusMessage = 'saiu para entrega';
          break;
        case 'entregue':
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

    clearCart();
    
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
