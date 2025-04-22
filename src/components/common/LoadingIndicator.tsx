
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Controla o indicador de carregamento global
    const handleRouteChangeStart = () => setIsLoading(true);
    const handleRouteChangeComplete = () => setIsLoading(false);
    
    window.addEventListener('popstate', handleRouteChangeStart);
    
    // Adiciona eventos personalizados para controlar carregamento durante atualizações importantes
    window.addEventListener('loading-start', handleRouteChangeStart);
    window.addEventListener('loading-end', handleRouteChangeComplete);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChangeStart);
      window.removeEventListener('loading-start', handleRouteChangeStart);
      window.removeEventListener('loading-end', handleRouteChangeComplete);
    };
  }, []);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white p-4 rounded-full shadow-lg">
        <Loader2 className="h-8 w-8 text-pizza-500 animate-spin" />
      </div>
    </div>
  );
};

export default LoadingIndicator;
