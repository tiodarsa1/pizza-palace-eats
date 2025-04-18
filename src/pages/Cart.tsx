
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, Home, ArrowRight, ShoppingCart as CartIcon, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  
  const handleIncrement = (id: number, currentQuantity: number) => {
    updateQuantity(id, currentQuantity + 1);
  };
  
  const handleDecrement = (id: number, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(id, currentQuantity - 1);
    } else {
      removeFromCart(id);
    }
  };

  const handleFinishOrder = () => {
    // In a real app, this would submit the order to a backend
    toast.success('Pedido finalizado com sucesso!', {
      description: `Total: R$ ${orderTotal.toFixed(2)}`,
      icon: <Check className="h-4 w-4 text-green-500" />,
      duration: 5000
    });
    clearCart();
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const deliveryFee = 8.90;
  const cartTotal = getCartTotal();
  const orderTotal = cartTotal + deliveryFee;

  return (
    <Layout>
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Seu Carrinho</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Home className="h-3 w-3 mr-1" />
              <span>Início</span>
              <span className="mx-2">/</span>
              <span className="text-pizza-500">Carrinho</span>
            </div>
          </div>
          
          {cart.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Itens do Pedido</h2>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-gray-500"
                        onClick={clearCart}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                    </div>
                    
                    {cart.map((item) => (
                      <div key={item.id} className="mb-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{item.name}</h3>
                              <span className="font-semibold text-pizza-500">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            
                            <div className="flex justify-between items-center mt-3">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => handleDecrement(item.id, item.quantity)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => handleIncrement(item.id, item.quantity)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-gray-500"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxa de entrega</span>
                        <span>R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-pizza-500">R$ {orderTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-pizza-500 hover:bg-pizza-600 py-6"
                      onClick={handleFinishOrder}
                      disabled={cart.length === 0}
                    >
                      Finalizar Pedido
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    
                    <Link to="/menu">
                      <Button variant="outline" className="w-full mt-4">
                        <CartIcon className="mr-2 h-4 w-4" />
                        Continuar comprando
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Informações de Entrega</h3>
                  <p className="text-sm text-yellow-700">
                    Entrega estimada em 30-45 minutos após a confirmação do pedido. Área de entrega limitada a 5km.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <CartIcon className="h-16 w-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-medium mb-2">Seu carrinho está vazio</h2>
              <p className="text-gray-500 mb-6">Adicione itens deliciosos para começar seu pedido</p>
              <Link to="/menu">
                <Button className="bg-pizza-500 hover:bg-pizza-600">
                  Ver Cardápio
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
