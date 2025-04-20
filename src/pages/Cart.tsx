import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Trash, 
  ShoppingBag, 
  ChevronUp, 
  ChevronDown, 
  ArrowLeft,
  LogIn
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useOrders, DeliveryInfo, PaymentInfo } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeliveryForm from '@/components/cart/DeliveryForm';
import PaymentMethodForm, { PaymentFormData } from '@/components/cart/PaymentMethodForm';
import AuthDialog from '@/components/auth/AuthDialog';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeliverySubmit = (data: DeliveryInfo) => {
    setDeliveryData(data);
    setIsDeliveryDialogOpen(false);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!deliveryData) {
      toast.error('Informações de entrega não fornecidas');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await createOrder(
        cart, 
        deliveryData, 
        {
          method: paymentData.method,
          change: paymentData.change,
        }, 
        getCartTotal()
      );
      
      setIsPaymentDialogOpen(false);
      toast.success('Pedido realizado com sucesso!');
      clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (!isAuthenticated) {
      setIsAuthDialogOpen(true);
    } else {
      setIsDeliveryDialogOpen(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleAuthSuccess = () => {
    setIsDeliveryDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Seu Carrinho</h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Adicione itens ao carrinho para fazer um pedido</p>
            <Button onClick={() => navigate('/menu')}>
              Ver Cardápio
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex border rounded-lg p-4 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="ml-4 flex-grow">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-500 text-sm">{item.description}</p>
                    {item.customizations?.excludedIngredients?.length > 0 && (
                      <p className="text-red-500 text-xs mt-1">
                        Sem: {item.customizations.excludedIngredients.join(', ')}
                      </p>
                    )}
                    <p className="font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-center mr-4">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <span className="my-1 font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={item.quantity <= 1}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg h-fit">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              <div className="space-y-3 border-b pb-4 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-primary">{formatPrice(getCartTotal())}</span>
              </div>
              <Button className="w-full mb-3" onClick={handleCheckout}>
                {!isAuthenticated ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar para Finalizar
                  </>
                ) : (
                  'Finalizar Pedido'
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => clearCart()}>
                Limpar Carrinho
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Informações de Entrega</DialogTitle>
          </DialogHeader>
          <DeliveryForm onSubmit={handleDeliverySubmit} />
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Método de Pagamento</DialogTitle>
          </DialogHeader>
          <PaymentMethodForm onSubmit={handlePaymentSubmit} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <AuthDialog 
        open={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
        onAuthSuccess={handleAuthSuccess}
      />
    </Layout>
  );
};

export default Cart;
