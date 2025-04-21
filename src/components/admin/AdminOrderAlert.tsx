
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, RefreshCw } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders, refreshOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const isMobile = useIsMobile();
  
  // Function to handle order notifications
  const handleOrderNotification = useCallback(() => {
    if (isAdmin()) {
      console.log('Admin alert: showing notification');
      setShowNotification(true);
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.volume = isMobile ? 1.0 : 0.5; // Higher volume on mobile
      audio.play().catch(e => console.log('Failed to play notification sound:', e));
      
      // Vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [isAdmin, isMobile]);
  
  // Check hasNewOrders from context
  useEffect(() => {
    if (isAdmin() && hasNewOrders) {
      console.log('Has new orders detected, showing notification');
      handleOrderNotification();
    }
  }, [hasNewOrders, isAdmin, handleOrderNotification]);
  
  // Listen for new order events from any source
  useEffect(() => {
    const handleNewOrder = () => {
      console.log('New order event received in AdminOrderAlert');
      handleOrderNotification();
    };
    
    window.addEventListener('new-order-created', handleNewOrder);
    
    // Also listen for storage changes for better cross-device/browser sync
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage event in AdminOrderAlert:', e.key);
      if (e.key === 'pizza-palace-new-orders' && e.newValue === 'true') {
        handleOrderNotification();
      }
      
      if (e.key === 'pizza-palace-order-broadcast' && e.newValue) {
        try {
          const broadcast = JSON.parse(e.newValue);
          if (broadcast.type === 'new-order') {
            console.log('New order broadcast received:', broadcast);
            handleOrderNotification();
            // Force refresh of orders
            refreshOrders();
          }
        } catch (error) {
          console.error('Error parsing broadcast data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleOrderNotification, refreshOrders]);
  
  // Set up manual polling for better cross-device compatibility
  useEffect(() => {
    if (isAdmin()) {
      const checkInterval = setInterval(() => {
        const newOrdersFlag = localStorage.getItem('pizza-palace-new-orders');
        if (newOrdersFlag === 'true' && !showNotification) {
          console.log('Polling detected new orders');
          handleOrderNotification();
        }
      }, 2000);
      
      return () => clearInterval(checkInterval);
    }
  }, [isAdmin, showNotification, handleOrderNotification]);
  
  if (!isAdmin() || !showNotification) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    refreshOrders();
    console.log('Manual refresh triggered from alert');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white shadow-sm"
        onClick={handleRefreshClick}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Atualizar
      </Button>
      
      <Link 
        to="/admin" 
        className="bg-red-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce"
        onClick={() => setShowNotification(false)}
      >
        <BellRing className="h-5 w-5" />
        <span className="font-medium">Novos pedidos!</span>
      </Link>
    </div>
  );
};

export default AdminOrderAlert;
