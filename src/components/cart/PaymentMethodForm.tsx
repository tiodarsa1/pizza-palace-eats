
import React from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, Wallet, LoaderCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';

const paymentFormSchema = z.object({
  method: z.enum(['credit', 'debit', 'cash', 'pix']),
  change: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
}

const PaymentMethodForm = ({ onSubmit, isLoading }: PaymentMethodFormProps) => {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const { cart, getCartTotal } = useCart();
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      method: 'credit',
      change: '',
    },
  });

  const watchMethod = form.watch('method');

  const handleSubmit = (data: PaymentFormData) => {
    setShowConfirmation(true);
  };

  const confirmOrder = () => {
    const data = form.getValues();
    setShowConfirmation(false);
    onSubmit(data);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Método de Pagamento</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit" id="credit" />
                      <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="debit" id="debit" />
                      <Label htmlFor="debit" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Débito
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                        <Banknote className="h-4 w-4" />
                        Dinheiro
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="h-4 w-4" />
                        PIX
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {watchMethod === 'cash' && (
            <FormField
              control={form.control}
              name="change"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Troco para</FormLabel>
                  <FormControl>
                    <input 
                      type="text" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="R$ 0,00" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full">
            Revisar Pedido
          </Button>
        </form>
      </Form>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Itens do Pedido:</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span>{item.quantity}x {item.name}</span>
                    {item.customizations?.excludedIngredients?.length > 0 && (
                      <p className="text-red-500 text-xs">
                        Sem: {item.customizations.excludedIngredients.join(', ')}
                      </p>
                    )}
                  </div>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <p>Método de Pagamento: {getPaymentMethodLabel(form.getValues().method)}</p>
                {form.getValues().change && (
                  <p>Troco para: R$ {form.getValues().change}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Voltar
            </Button>
            <Button onClick={confirmOrder} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pedido'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentMethodForm;
