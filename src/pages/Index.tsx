
import React, { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';

// Componentes carregados de forma lazy para melhorar a performance inicial
const Categories = lazy(() => import('@/components/home/Categories'));
const PopularItems = lazy(() => import('@/components/home/PopularItems'));
const Promotions = lazy(() => import('@/components/home/Promotions'));
const AppDownload = lazy(() => import('@/components/home/AppDownload'));

// Componente de fallback simples enquanto os componentes lazy carregam
const SimpleFallback = () => <div className="py-8 animate-pulse bg-gray-100" />;

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Suspense fallback={<SimpleFallback />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SimpleFallback />}>
        <PopularItems />
      </Suspense>
      <Suspense fallback={<SimpleFallback />}>
        <Promotions />
      </Suspense>
      <Suspense fallback={<SimpleFallback />}>
        <AppDownload />
      </Suspense>
    </Layout>
  );
};

export default Index;
