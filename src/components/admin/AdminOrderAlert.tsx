
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
const NOTIFICATION_THROTTLE_MS = 5000; // 5 seconds
const NOTIFICATION_DISPLAY_TIME = 10000; // 10 seconds

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders, refreshOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
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
  
  // Function to handle order notifications with smarter logic
  const handleOrderNotification = useCallback(() => {
    if (isAdmin()) {
      console.log('Admin alert: showing notification');
      setShowNotification(true);
      playNotificationSound();
      
      // Auto-hide notification after display time
      setTimeout(() => {
        setShowNotification(false);
      }, NOTIFICATION_DISPLAY_TIME);
    }
  }, [isAdmin, playNotificationSound]);
  
  // Monitor order count changes instead of just flags
  useEffect(() => {
    if (isAdmin()) {
      try {
        const storedOrders = localStorage.getItem('pizza-palace-orders-v2') || localStorage.getItem('pizza-palace-orders');
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          const currentCount = orders.length;
          
          // Only show notification if order count actually increased
          if (lastOrderCount > 0 && currentCount > lastOrderCount) {
            console.log('Order count increased, showing notification');
            handleOrderNotification();
          }
          
          setLastOrderCount(currentCount);
        }
      } catch (e) {
        console.error('Error checking order count:', e);
      }
    }
  }, [isAdmin, handleOrderNotification, lastOrderCount]);

  // Enhanced event listeners with smarter detection
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      console.log('New order event received in AdminOrderAlert:', event.type);
      if (isAdmin() && !showNotification) { // Only show if not already showing
        handleOrderNotification();
      }
    };
    
    // Storage event handler with order count checking
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage event in AdminOrderAlert:', e.key);
      
      // Check all possible broadcast and flag keys
      const orderKeys = [
        'pizza-palace-orders', 'pizza-palace-orders-v2',
        'pizza-palace-order-broadcast', 'pizza-palace-order-broadcast-v2'
      ];
      
      if (orderKeys.includes(e.key || '') && isAdmin() && !showNotification) {
        // Only react to actual new orders, not just any storage change
        if (e.key?.includes('broadcast') && e.newValue) {
          try {
            const broadcast = JSON.parse(e.newValue);
            if (broadcast.type === 'new-order') {
              console.log('New order detected via storage event');
              handleOrderNotification();
              refreshOrders();
            }
          } catch (error) {
            console.log('Error parsing broadcast:', error);
          }
        }
      }
    };
    
    // Set up event listeners
    window.addEventListener('new-order-created', handleNewOrder, { capture: true });
    window.addEventListener('storage', handleStorageChange, { capture: true });
    
    // Initial order count setup
    if (isAdmin() && lastOrderCount === 0) {
      try {
        const storedOrders = localStorage.getItem('pizza-palace-orders-v2') || localStorage.getItem('pizza-palace-orders');
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          setLastOrderCount(orders.length);
        }
      } catch (e) {
        console.error('Error setting initial order count:', e);
      }
    }
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAdmin, showNotification, handleOrderNotification, refreshOrders, lastOrderCount]);
  
  if (!isAdmin()) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsRefreshing(true);
    
    refreshOrders();
    
    // Show feedback toast
    toast.info("Atualizando pedidos...");
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
    
    console.log('Manual refresh triggered from alert');
  };
  
  const handleNotificationClick = () => {
    setShowNotification(false);
    // Clear the new orders flag when user acknowledges
    localStorage.setItem('pizza-palace-new-orders-v2', 'false');
    localStorage.setItem('pizza-palace-new-orders', 'false');
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
          onClick={handleNotificationClick}
        >
          <BellRing className="h-5 w-5" />
          <span className="font-medium">Novos pedidos!</span>
        </Link>
      )}
    </div>
  );
};

export default AdminOrderAlert;
