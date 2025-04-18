
import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import PopularItems from '@/components/home/PopularItems';
import Promotions from '@/components/home/Promotions';
import AppDownload from '@/components/home/AppDownload';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <PopularItems />
      <Promotions />
      <AppDownload />
    </Layout>
  );
};

export default Index;
