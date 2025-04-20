
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useOrders, Order } from '@/context/OrderContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ShoppingCart, Clock, MapPin, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OrderHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const { getUserOrders, reorder } = useOrders();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    toast.error('Você precisa estar logado para ver seu histórico de pedidos');
    return null;
  }

  const userOrders = user ? getUserOrders(user.id) : [];
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const handleReorder = (orderId: string) => {
    reorder(orderId);
    navigate('/cart');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em preparação':
        return 'bg-orange-100 text-orange-800';
      case 'saiu para entrega':
        return 'bg-blue-100 text-blue-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em preparação':
        return 'Em preparação';
      case 'saiu para entrega':
        return 'Saiu para entrega';
      case 'entregue':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Histórico de Pedidos</h1>
        
        {userOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Você ainda não realizou nenhum pedido.</p>
            <Button onClick={() => navigate('/menu')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Cardápio
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {userOrders.map((order) => (
              <Card key={order.id} className="w-full">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span>Pedido #{order.id.split('-')[1]}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      <Clock className="inline mr-1 h-4 w-4" />
                      {formatDate(order.date)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatPrice(item.price)}</TableCell>
                            <TableCell>{formatPrice(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                      <p className="flex items-center text-gray-700">
                        <MapPin className="mr-2 h-4 w-4" />
                        {order.delivery.street}, {order.delivery.number}
                        {order.delivery.complement && ` - ${order.delivery.complement}`}
                      </p>
                      <p className="text-gray-700">{order.delivery.neighborhood}</p>
                      <p className="flex items-center text-gray-700 mt-1">
                        <Phone className="mr-2 h-4 w-4" />
                        {order.delivery.phone}
                      </p>
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold mb-2">Resumo</h3>
                        <p className="text-xl font-bold text-primary">
                          Total: {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => handleReorder(order.id)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Pedir Novamente
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistory;
