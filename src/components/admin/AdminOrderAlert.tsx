
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, RefreshCw } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Sound/vibration event throttling to prevent excessive notifications
let lastNotificationTime = 0;
const NOTIFICATION_THROTTLE_MS = 2000; // 2 seconds

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders, refreshOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  
  // Notification sound helper with throttling
  const playNotificationSound = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_THROTTLE_MS) {
      console.log('Notification throttled');
      return;
    }
    
    lastNotificationTime = now;
    console.log('Playing notification sound');
    
    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.volume = isMobile ? 1.0 : 0.5; // Higher volume on mobile
    audio.play().catch(e => console.log('Failed to play notification sound:', e));
    
    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [isMobile]);
  
  // Function to handle order notifications
  const handleOrderNotification = useCallback(() => {
    if (isAdmin()) {
      console.log('Admin alert: showing notification');
      setShowNotification(true);
      playNotificationSound();
    }
  }, [isAdmin, playNotificationSound]);
  
  // Check hasNewOrders from context
  useEffect(() => {
    if (isAdmin() && hasNewOrders) {
      console.log('Has new orders detected, showing notification');
      handleOrderNotification();
    }
  }, [hasNewOrders, isAdmin, handleOrderNotification]);

  // Enhanced event listeners with multiple sources monitoring
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      console.log('New order event received in AdminOrderAlert:', event.type);
      if (isAdmin()) {
        handleOrderNotification();
      }
    };
    
    // Storage event handler with broader key coverage
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage event in AdminOrderAlert:', e.key);
      
      // Check all possible broadcast and flag keys
      const orderKeys = [
        'pizza-palace-new-orders', 'pizza-palace-new-orders-v2',
        'pizza-palace-order-broadcast', 'pizza-palace-order-broadcast-v2',
        'pizza-palace-force-refresh'
      ];
      
      if (orderKeys.includes(e.key || '') && isAdmin()) {
        if (e.newValue === 'true' || (e.newValue && e.newValue.includes('new-order'))) {
          console.log('New order detected via storage event');
          handleOrderNotification();
          // Force refresh of orders
          refreshOrders();
        }
      }
    };
    
    // Set up intensive multi-source monitoring for new orders
    window.addEventListener('new-order-created', handleNewOrder, { capture: true });
    window.addEventListener('orders-updated', handleNewOrder, { capture: true });
    window.addEventListener('order-sync-required', handleNewOrder, { capture: true });
    window.addEventListener('storage', handleStorageChange, { capture: true });
    
    // Initial force refresh
    if (isAdmin()) {
      setTimeout(() => {
        refreshOrders();
        console.log('Initial force refresh in AdminOrderAlert');
      }, 1000);
    }
    
    // Set up polling for better cross-device compatibility
    const checkInterval = setInterval(() => {
      if (isAdmin()) {
        // Check all possible flag keys
        const newOrdersFlagV2 = localStorage.getItem('pizza-palace-new-orders-v2');
        const newOrdersFlag = localStorage.getItem('pizza-palace-new-orders');
        
        if ((newOrdersFlagV2 === 'true' || newOrdersFlag === 'true') && !showNotification) {
          console.log('Polling detected new orders');
          handleOrderNotification();
          refreshOrders();
        }
      }
    }, 1500); // Check every 1.5 seconds
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('orders-updated', handleNewOrder);
      window.removeEventListener('order-sync-required', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [isAdmin, showNotification, handleOrderNotification, refreshOrders]);
  
  if (!isAdmin()) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsRefreshing(true);
    
    // Try resetting all caches during manual refresh
    try {
      localStorage.setItem('pizza-palace-force-refresh', Date.now().toString());
      
      // Clear storage flags to ensure fresh state
      localStorage.removeItem('admin-last-refresh');
      localStorage.setItem('admin-last-refresh', Date.now().toString());
    } catch (e) {
      console.error('Error during cache reset:', e);
    }
    
    refreshOrders();
    
    // Show feedback toast
    toast.info("Atualizando pedidos...");
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
    
    console.log('Manual refresh triggered from alert');
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
