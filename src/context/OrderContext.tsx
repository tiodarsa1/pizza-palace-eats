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

// Função para validar se um string é um UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Função para gerar um UUID válido a partir de um string
const generateValidUUID = (input: string): string => {
  // Se já é um UUID válido, retorna como está
  if (isValidUUID(input)) {
    return input;
  }
  
  // Cria um UUID válido usando crypto.randomUUID() ou fallback
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback para browsers que não suportam crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

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
      console.error('User not authenticated');
      throw new Error('User must be logged in to create an order');
    }

    try {
      console.log('Creating order with data:', {
        user: user,
        items: items,
        delivery: delivery,
        payment: payment,
        total: total
      });

      // Validar dados antes de enviar
      if (!items || items.length === 0) {
        throw new Error('Carrinho vazio');
      }

      if (!delivery.street || !delivery.number || !delivery.neighborhood || !delivery.phone) {
        throw new Error('Informações de entrega incompletas');
      }

      if (!payment.method) {
        throw new Error('Método de pagamento não selecionado');
      }

      // Garantir que o user_id seja um UUID válido
      const validUserId = generateValidUUID(user.id);
      console.log('Original user ID:', user.id, 'Valid UUID:', validUserId);

      const orderData = {
        user_id: validUserId,
        user_name: user.name || 'Usuário',
        items: JSON.parse(JSON.stringify(items)), // Garantir serialização correta
        delivery: JSON.parse(JSON.stringify(delivery)), // Garantir serialização correta
        payment: JSON.parse(JSON.stringify(payment)), // Garantir serialização correta
        total: Number(total),
        status: 'pending'
      };

      console.log('Sending order data to Supabase:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw new Error(`Erro do banco de dados: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após criação do pedido');
      }

      console.log('Order created successfully:', data);
      toast.success('Pedido criado com sucesso!');
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Melhorar mensagens de erro para o usuário
      let errorMessage = 'Erro ao criar pedido. Tente novamente.';
      
      if (error.message?.includes('violates row-level security')) {
        errorMessage = 'Erro de permissão. Faça login novamente.';
      } else if (error.message?.includes('invalid input syntax')) {
        errorMessage = 'Dados inválidos. Verifique as informações.';
      } else if (error.message?.includes('connection')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.message && error.message.length < 100) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
