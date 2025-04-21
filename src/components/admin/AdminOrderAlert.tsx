
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminOrderAlert: React.FC = () => {
  const { hasNewOrders } = useOrders();
  const { isAdmin } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Only show notification to admins
    if (isAdmin() && hasNewOrders) {
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
  }, [hasNewOrders, isAdmin, isMobile]);
  
  // Listen for new order events
  useEffect(() => {
    const handleNewOrder = () => {
      if (isAdmin()) {
        setShowNotification(true);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = isMobile ? 1.0 : 0.5; // Higher volume on mobile
        audio.play().catch(e => console.log('Failed to play notification sound:', e));
        
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    };
    
    window.addEventListener('new-order-created', handleNewOrder);
    
    // Also listen for storage changes for better cross-device/browser sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pizza-palace-new-orders' && e.newValue === 'true') {
        handleNewOrder();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('new-order-created', handleNewOrder);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAdmin, isMobile]);
  
  if (!isAdmin() || !showNotification) {
    return null;
  }
  
  return (
    <Link 
      to="/admin" 
      className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce"
      onClick={() => setShowNotification(false)}
    >
      <BellRing className="h-5 w-5" />
      <span className="font-medium">Novos pedidos!</span>
    </Link>
  );
};

export default AdminOrderAlert;
