
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { lazy, Suspense } from "react";
import LoadingIndicator from "./components/common/LoadingIndicator";
import AdminOrderAlert from "./components/admin/AdminOrderAlert";
import React, { useState, useEffect } from "react";

// Carregamento lazy de páginas para melhorar performance inicial
const Index = lazy(() => import("./pages/Index"));
const Menu = lazy(() => import("./pages/Menu"));
const Cart = lazy(() => import("./pages/Cart"));
const Promotions = lazy(() => import("./pages/Promotions"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Componente de fallback simples enquanto as páginas carregam
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pizza-500" />
  </div>
);

// Create a client com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10 segundos - reduz a pressão de novas solicitações
      gcTime: 300000, // 5 minutos - mantém cache por mais tempo (substitui cacheTime)
      refetchOnWindowFocus: false, // Previne múltiplas requisições ao retornar à janela
      retry: 1, // Reduz tentativas para diminuir carga
      refetchInterval: false, // Desativa polling automático
    },
  },
});

const App = () => {
  // Force refresh orders on page reload by clearing old cache
  useEffect(() => {
    console.log("App mounted, clearing old caches");
    
    // Função para limitar operações pesadas
    const setupCacheBusting = () => {
      // Get current timestamp for cache-busting
      const timestamp = Date.now().toString();
      
      try {
        // Store timestamp to detect app loads in other tabs
        sessionStorage.setItem('app-init-time', timestamp);
        localStorage.setItem('pizza-palace-app-reload', timestamp);
      } catch (e) {
        console.error('Error clearing caches on app init:', e);
      }
    };
    
    // Utiliza timeout para dar prioridade à renderização da UI
    setTimeout(setupCacheBusting, 1000);
  }, []);
  
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <OrderProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <LoadingIndicator />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/promotions" element={<Promotions />} />
                      <Route path="/orders" element={<OrderHistory />} />
                      <Route path="/admin" element={<AdminOrders />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <AdminOrderAlert />
                </BrowserRouter>
              </OrderProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
