
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, RefreshCw } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders, refreshOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  
  // Monitor novos pedidos
  useEffect(() => {
    if (hasNewOrders && isAdmin()) {
      console.log('Admin alert: showing notification for new orders');
      setShowNotification(true);
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.volume = isMobile ? 1.0 : 0.5;
      audio.play().catch(e => console.log('Failed to play notification sound:', e));
      
      // Vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Auto-hide notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    }
  }, [hasNewOrders, isAdmin, isMobile]);
  
  if (!isAdmin()) {
    return null;
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsRefreshing(true);
    
    refreshOrders();
    
    toast.info("Atualizando pedidos...");
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
    
    console.log('Manual refresh triggered from alert');
  };
  
  const handleNotificationClick = () => {
    setShowNotification(false);
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
