
import React, { Suspense, lazy } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';

// Lazy load components to improve performance
const Categories = lazy(() => import('@/components/home/Categories'));
const PopularItems = lazy(() => import('@/components/home/PopularItems'));
const Promotions = lazy(() => import('@/components/home/Promotions'));
const AppDownload = lazy(() => import('@/components/home/AppDownload'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="py-12 flex justify-center items-center">
    <div className="animate-pulse h-16 w-16 rounded-full bg-gray-200"></div>
  </div>
);

const Index = () => {
  // Force synchronize orders when visiting homepage
  React.useEffect(() => {
    try {
      // Broadcast a sync request when user visits home page
      const syncEvent = new CustomEvent('order-sync-required', { 
        detail: { timestamp: Date.now(), source: 'home-page' } 
      });
      window.dispatchEvent(syncEvent);
      
      // Set sync timestamp 
      localStorage.setItem('pizza-palace-last-sync', Date.now().toString());
    } catch (e) {
      console.error('Error broadcasting sync event from home page:', e);
    }
  }, []);
  
  return (
    <Layout>
      <Hero />
      <Suspense fallback={<LoadingFallback />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <PopularItems />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <Promotions />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <AppDownload />
      </Suspense>
    </Layout>
  );
};

export default Index;
