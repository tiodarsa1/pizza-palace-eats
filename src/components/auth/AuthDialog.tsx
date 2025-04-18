
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

const AuthDialog = ({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>('login');

  const handleSuccess = () => {
    if (onAuthSuccess) onAuthSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Conta de Usuário</DialogTitle>
          <DialogDescription>
            Entre ou crie uma conta para continuar com seu pedido.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Cadastro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={handleSuccess} />
            <p className="text-sm text-center mt-4">
              Não tem uma conta?{' '}
              <button 
                onClick={() => setActiveTab('signup')} 
                className="text-primary hover:underline"
              >
                Cadastre-se
              </button>
            </p>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-4">
            <SignupForm onSuccess={handleSuccess} />
            <p className="text-sm text-center mt-4">
              Já tem uma conta?{' '}
              <button 
                onClick={() => setActiveTab('login')} 
                className="text-primary hover:underline"
              >
                Faça login
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
