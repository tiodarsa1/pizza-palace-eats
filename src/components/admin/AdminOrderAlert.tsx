
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, RefreshCw } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Controle de throttling para eventos de som/vibração para evitar notificações excessivas
let lastNotificationTime = 0;
const NOTIFICATION_THROTTLE_MS = 2000; // 2 segundos

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders, refreshOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  
  // Helper para som de notificação com throttling
  const playNotificationSound = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_THROTTLE_MS) {
      console.log('Notificação limitada por throttling');
      return;
    }
    
    lastNotificationTime = now;
    console.log('Tocando som de notificação');
    
    // Reproduz som de notificação
    const audio = new Audio('/notification.mp3');
    audio.volume = isMobile ? 1.0 : 0.5; // Volume mais alto no mobile
    audio.play().catch(e => console.log('Falha ao tocar som de notificação:', e));
    
    // Vibra o dispositivo se suportado
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [isMobile]);
  
  // Função para lidar com notificações de pedido
  const handleOrderNotification = useCallback(() => {
    if (isAdmin()) {
      console.log('Alerta de administrador: mostrando notificação');
      setShowNotification(true);
      playNotificationSound();
    }
  }, [isAdmin, playNotificationSound]);
  
  // Verifica hasNewOrders do contexto
  useEffect(() => {
    if (isAdmin() && hasNewOrders) {
      console.log('Novos pedidos detectados, mostrando notificação');
      handleOrderNotification();
    }
  }, [hasNewOrders, isAdmin, handleOrderNotification]);

  // Event listeners aprimorados com monitoramento de múltiplas fontes
  useEffect(() => {
    // Manipulador de novos pedidos genérico
    const handleNewOrder = (event: Event) => {
      console.log('Evento de novo pedido recebido em AdminOrderAlert:', event.type);
      if (isAdmin()) {
        handleOrderNotification();
        
        // Importante: forçar atualização de pedidos quando eventos são detectados
        refreshOrders();
      }
    };
    
    // Storage event handler com cobertura mais ampla de chaves
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Evento de armazenamento em AdminOrderAlert:', e.key);
      
      // Verifica todas as possíveis chaves de broadcast e flag
      const orderKeys = [
        'pizza-palace-new-orders', 'pizza-palace-new-orders-v2',
        'pizza-palace-order-broadcast', 'pizza-palace-order-broadcast-v2',
        'pizza-palace-force-refresh'
      ];
      
      if (orderKeys.includes(e.key || '') && isAdmin()) {
        if (e.newValue === 'true' || (e.newValue && e.newValue.includes('new-order'))) {
          console.log('Novo pedido detectado via evento de armazenamento');
          handleOrderNotification();
          // Força atualização de pedidos
          refreshOrders();
        }
      }
    };
    
    // Configura monitoramento intensivo de múltiplas fontes para novos pedidos
    window.addEventListener('new-order-created', handleNewOrder, { capture: true });
    window.addEventListener('orders-updated', handleNewOrder, { capture: true });
    window.addEventListener('order-sync-required', handleNewOrder, { capture: true });
    window.addEventListener('storage', handleStorageChange, { capture: true });
    
    // Configura polling para melhor compatibilidade entre dispositivos
    const checkInterval = setInterval(() => {
      if (isAdmin()) {
        // Verifica todas as possíveis chaves de flag
        const newOrdersFlagV2 = localStorage.getItem('pizza-palace-new-orders-v2');
        const newOrdersFlag = localStorage.getItem('pizza-palace-new-orders');
        
        if ((newOrdersFlagV2 === 'true' || newOrdersFlag === 'true') && !showNotification) {
          console.log('Polling detectou novos pedidos');
          handleOrderNotification();
          refreshOrders(); // Força atualização quando polling detecta novos pedidos
        }
      }
    }, 1500); // Verifica a cada 1.5 segundos
    
    // Configura um refrescamento periódico mais intensivo para os administradores
    const refreshInterval = setInterval(() => {
      if (isAdmin()) {
        console.log('Intervalo periódico de atualização para administrador');
        refreshOrders();
      }
    }, 10000); // Atualiza a cada 10 segundos para admins
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('orders-updated', handleNewOrder);
      window.removeEventListener('order-sync-required', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
      clearInterval(refreshInterval);
    };
  }, [isAdmin, showNotification, handleOrderNotification, refreshOrders]);
  
  if (!isAdmin()) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsRefreshing(true);
    refreshOrders();
    
    // Métodos adicionais de sincronização para garantir atualização
    try {
      localStorage.setItem('pizza-palace-force-refresh', Date.now().toString());
      
      // Dispara eventos personalizados para garantir sincronização
      const syncEvent = new CustomEvent('order-sync-required', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(syncEvent);
    } catch (e) {
      console.error('Erro ao disparar sincronização manual:', e);
    }
    
    // Mostra feedback toast
    toast.info("Atualizando pedidos...");
    
    // Redefine estado de atualização após um pequeno atraso
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
    
    console.log('Atualização manual acionada a partir do alerta');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white shadow-sm"
        onClick={handleRefreshClick}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
      
      {showNotification && (
        <Link 
          to="/admin" 
          className="bg-red-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce"
          onClick={() => setShowNotification(false)}
        >
          <BellRing className="h-5 w-5" />
          <span className="font-medium">Novos pedidos!</span>
        </Link>
      )}
    </div>
  );
};

export default AdminOrderAlert;
