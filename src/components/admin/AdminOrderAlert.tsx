
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const refreshTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  
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
  
  // Função para lidar com notificações de pedido com debounce
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

  // Event listeners aprimorados com monitoramento otimizado
  useEffect(() => {
    if (!isAdmin()) return;
    
    // Manipulador de novos pedidos genérico
    const handleNewOrder = (event: Event) => {
      console.log('Evento de novo pedido recebido em AdminOrderAlert:', event.type);
      handleOrderNotification();
      refreshOrders();
    };
    
    // Storage event handler com cobertura mais ampla de chaves
    const handleStorageChange = (e: StorageEvent) => {
      // Verifica todas as possíveis chaves de broadcast e flag
      const orderKeys = [
        'pizza-palace-new-orders', 'pizza-palace-new-orders-v2',
        'pizza-palace-order-broadcast', 'pizza-palace-order-broadcast-v2',
        'pizza-palace-force-refresh'
      ];
      
      if (orderKeys.includes(e.key || '')) {
        if (e.newValue === 'true' || (e.newValue && e.newValue.includes('new-order'))) {
          console.log('Novo pedido detectado via evento de armazenamento');
          handleOrderNotification();
          refreshOrders();
        }
      }
    };
    
    // Configura monitoramento de múltiplas fontes para novos pedidos
    window.addEventListener('new-order-created', handleNewOrder);
    window.addEventListener('orders-updated', handleNewOrder);
    window.addEventListener('order-sync-required', handleNewOrder);
    window.addEventListener('storage', handleStorageChange);
    
    // Configura polling com intervalos mais longos para melhor performance
    pollTimerRef.current = window.setInterval(() => {
      // Verifica todas as possíveis chaves de flag
      const newOrdersFlagV2 = localStorage.getItem('pizza-palace-new-orders-v2');
      const newOrdersFlag = localStorage.getItem('pizza-palace-new-orders');
      
      if ((newOrdersFlagV2 === 'true' || newOrdersFlag === 'true') && !showNotification) {
        console.log('Polling detectou novos pedidos');
        handleOrderNotification();
        refreshOrders();
      }
    }, 3000); // Verifica a cada 3 segundos (aumentado para reduzir carga)
    
    // Configura um refrescamento periódico com intervalo maior
    refreshTimerRef.current = window.setInterval(() => {
      console.log('Intervalo periódico de atualização para administrador');
      refreshOrders();
    }, 30000); // Atualiza a cada 30 segundos (aumentado para reduzir carga)
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('orders-updated', handleNewOrder);
      window.removeEventListener('order-sync-required', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
      
      // Limpar intervalos ao desmontar
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isAdmin, showNotification, handleOrderNotification, refreshOrders]);
  
  if (!isAdmin()) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Previne múltiplos cliques rápidos
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    refreshOrders();
    
    // Métodos de sincronização otimizados
    try {
      localStorage.setItem('pizza-palace-force-refresh', Date.now().toString());
      
      // Dispara evento personalizado para sincronização
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
