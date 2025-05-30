
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CartItem, useCart } from './CartContext';
import { useAuth, User } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  deleteOrder: (orderId: string) => Promise<void>;
  hasNewOrders: boolean;
  clearNewOrdersFlag: () => void;
  getAllOrders: () => Order[];
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState<boolean>(false);
  const { addToCart, clearCart } = useCart();
  const { user } = useAuth();
  
  // Função para converter dados do banco para o formato da aplicação
  const convertDbOrderToOrder = (dbOrder: any): Order => {
    return {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      userName: dbOrder.user_name,
      items: dbOrder.items,
      delivery: dbOrder.delivery,
      payment: dbOrder.payment,
      total: parseFloat(dbOrder.total),
      date: dbOrder.created_at,
      status: dbOrder.status as OrderStatus
    };
  };

  // Função para carregar pedidos do banco de dados
  const loadOrdersFromDatabase = useCallback(async () => {
    try {
      console.log('Loading orders from database...');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading orders:', error);
        return;
      }
      
      const formattedOrders = data?.map(convertDbOrderToOrder) || [];
      console.log('Orders loaded from database:', formattedOrders.length);
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders from database:', error);
    }
  }, []);

  // Configurar listener em tempo real para novos pedidos
  useEffect(() => {
    console.log('Setting up real-time order listener...');
    
    // Carregar pedidos iniciais
    loadOrdersFromDatabase();
    
    // Configurar listener em tempo real
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Real-time order change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = convertDbOrderToOrder(payload.new);
            setOrders(prev => [newOrder, ...prev]);
            setHasNewOrders(true);
            toast.success('Novo pedido recebido!');
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = convertDbOrderToOrder(payload.new);
            setOrders(prev => prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            ));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('Cleaning up real-time listener');
      supabase.removeChannel(channel);
    };
  }, [loadOrdersFromDatabase]);

  const createOrder = async (
    items: CartItem[], 
    delivery: DeliveryInfo, 
    payment: PaymentInfo,
    total: number
  ): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }

    try {
      console.log('Creating order in database...');
      
      const orderData = {
        user_id: user.id,
        user_name: user.name,
        items: items,
        delivery: delivery,
        payment: payment,
        total: total,
        status: 'pending' as OrderStatus
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      console.log('Order created successfully:', data.id);
      toast.success('Pedido criado com sucesso!');
      
      return data.id;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido');
      throw error;
    }
  };

  const deleteOrder = async (orderId: string): Promise<void> => {
    try {
      console.log('Deleting order:', orderId);
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }

      console.log('Order deleted successfully');
      toast.success('Pedido deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao deletar pedido');
      throw error;
    }
  };

  const getUserOrders = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getAllOrders = useCallback((): Order[] => {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        addToCart(item, item.quantity);
      }, index * 50);
    });
    
    setTimeout(() => {
      toast.success('Itens adicionados ao carrinho');
    }, orderToReuse.items.length * 50 + 100);
  }, [orders, clearCart, addToCart]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      console.log('Updating order status:', orderId, status);
      
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

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
      
      toast.success(`Pedido #${orderId.substring(0, 8)} ${statusMessage}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const refreshOrders = useCallback(() => {
    console.log('Manual refresh triggered');
    loadOrdersFromDatabase();
  }, [loadOrdersFromDatabase]);

  const clearNewOrdersFlag = () => {
    setHasNewOrders(false);
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders,
        createOrder,
        getUserOrders,
        reorder,
        updateOrderStatus,
        deleteOrder,
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
