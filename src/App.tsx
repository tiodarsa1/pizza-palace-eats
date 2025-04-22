
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Promotions from "./pages/Promotions";
import OrderHistory from "./pages/OrderHistory";
import AdminOrders from "./pages/AdminOrders";
import NotFound from "./pages/NotFound";
import AdminOrderAlert from "./components/admin/AdminOrderAlert";
import React, { useState, useEffect } from "react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Consider data as always stale, good for realtime data needs
      refetchOnWindowFocus: true, // Refetch when window regains focus
      retry: 3, // Retry failed requests 3 times
    },
  },
});

const App = () => {
  // Force refresh orders on page reload by clearing old cache
  useEffect(() => {
    console.log("App mounted, clearing old caches");
    
    // Get current timestamp for cache-busting
    const timestamp = Date.now().toString();
    
    try {
      // Store timestamp to detect app loads in other tabs
      sessionStorage.setItem('app-init-time', timestamp);
      localStorage.setItem('pizza-palace-app-reload', timestamp);
    } catch (e) {
      console.error('Error clearing caches on app init:', e);
    }
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
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/promotions" element={<Promotions />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/admin" element={<AdminOrders />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
