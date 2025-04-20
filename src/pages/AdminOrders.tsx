
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, BellRing, Check, Truck, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useOrders, Order, OrderStatus } from '@/context/OrderContext';
import Layout from '@/components/layout/Layout';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    case 'em preparação':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Em preparação</Badge>;
    case 'saiu para entrega':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Saiu para entrega</Badge>;
    case 'entregue':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'credit':
      return 'Cartão de Crédito';
    case 'debit':
      return 'Cartão de Débito';
    case 'cash':
      return 'Dinheiro';
    case 'pix':
      return 'PIX';
    default:
      return method;
  }
};

const OrderDetailModal = ({ order, onClose, onUpdateStatus }: { 
  order: Order | null, 
  onClose: () => void,
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
}) => {
  if (!order) return null;
  
  const getNextStatus = (): { status: OrderStatus, label: string, icon: JSX.Element } | null => {
    switch (order.status) {
      case 'pending':
        return { status: 'preparing', label: 'Iniciar Preparação', icon: <Package className="h-4 w-4" /> };
      case 'preparing':
        return { status: 'delivering', label: 'Enviar para Entrega', icon: <Truck className="h-4 w-4" /> };
      case 'delivering':
        return { status: 'completed', label: 'Confirmar Entrega', icon: <Check className="h-4 w-4" /> };
      default:
        return null;
    }
  };
  
  const nextStatus = getNextStatus();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Pedido #{order.id.split('-')[1]}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Informações do Cliente</h3>
              <p><strong>Nome:</strong> {order.userName}</p>
              <p><strong>Endereço:</strong> {order.delivery.street}, {order.delivery.number}</p>
              {order.delivery.complement && <p><strong>Complemento:</strong> {order.delivery.complement}</p>}
              <p><strong>Bairro:</strong> {order.delivery.neighborhood}</p>
              <p><strong>Telefone:</strong> {order.delivery.phone}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Detalhes do Pedido</h3>
              <p><strong>Data:</strong> {formatDate(order.date)}</p>
              <p><strong>Status:</strong> {getStatusBadge(order.status)}</p>
              <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
              <p><strong>Pagamento:</strong> {order.payment ? getPaymentMethodLabel(order.payment.method) : 'Não informado'}</p>
              {order.payment && order.payment.method === 'cash' && order.payment.change && (
                <p><strong>Troco para:</strong> R$ {order.payment.change}</p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Itens</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Personalização</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, idx) => (
                  <TableRow key={`${item.id}-${idx}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.customizations?.excludedIngredients?.length > 0 ? (
                        <span className="text-sm text-red-600">
                          Sem: {item.customizations.excludedIngredients.join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Nenhuma</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 flex justify-end gap-4">
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <Button 
                variant="destructive"
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
              >
                Cancelar Pedido
              </Button>
            )}
            
            {nextStatus && (
              <Button 
                onClick={() => onUpdateStatus(order.id, nextStatus.status)}
                className="gap-2"
              >
                {nextStatus.icon}
                {nextStatus.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { getAllOrders, updateOrderStatus, hasNewOrders, clearNewOrdersFlag } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  
  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para acessar esta página');
      navigate('/');
      return;
    }
    
    if (!isAdmin()) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/');
      return;
    }
    
    // Clear new orders notification when the admin visits the page
    if (hasNewOrders) {
      clearNewOrdersFlag();
    }
  }, [isAuthenticated, isAdmin, navigate, hasNewOrders, clearNewOrdersFlag]);
  
  const allOrders = getAllOrders();
  
  const filteredOrders = filter === 'all' 
    ? allOrders 
    : allOrders.filter(order => order.status === filter);
  
  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    setSelectedOrder(prev => prev?.id === orderId ? {...prev, status} : prev);
  };
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gerenciamento de Pedidos</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os pedidos dos clientes
              </CardDescription>
            </div>
            
            {hasNewOrders && (
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full animate-pulse">
                <BellRing className="h-4 w-4" />
                <span className="text-sm font-medium">Novos pedidos!</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 flex flex-wrap gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilter('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button 
                variant={filter === 'pending' ? 'default' : 'outline'} 
                onClick={() => setFilter('pending')}
                size="sm"
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                Pendentes
              </Button>
              <Button 
                variant={filter === 'preparing' ? 'default' : 'outline'} 
                onClick={() => setFilter('preparing')}
                size="sm"
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Em Preparação
              </Button>
              <Button 
                variant={filter === 'delivering' ? 'default' : 'outline'} 
                onClick={() => setFilter('delivering')}
                size="sm"
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                Em Entrega
              </Button>
              <Button 
                variant={filter === 'completed' ? 'default' : 'outline'} 
                onClick={() => setFilter('completed')}
                size="sm"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Entregues
              </Button>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhum pedido encontrado para este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => (
                      <TableRow 
                        key={order.id}
                        className={order.status === 'pending' ? 'bg-yellow-50' : ''}
                      >
                        <TableCell className="font-medium">#{order.id.split('-')[1]}</TableCell>
                        <TableCell>{order.userName || 'Cliente'}</TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </Layout>
  );
};

export default AdminOrders;
