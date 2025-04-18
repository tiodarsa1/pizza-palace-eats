
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Star, Search, Filter, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pizzaData, beverageData, PizzaItem } from '@/data/pizzaData';
import { useCart } from '@/context/CartContext';

const Menu = () => {
  const location = useLocation();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredItems, setFilteredItems] = useState<PizzaItem[]>([]);

  // Get category from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setActiveCategory(category);
    }
  }, [location.search]);

  // Filter items based on search term and active category
  useEffect(() => {
    const allItems = [...pizzaData, ...beverageData];
    
    let filtered = allItems;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => item.name.toLowerCase().includes(term) || 
                item.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, activeCategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <Layout>
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Nosso Cardápio</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Home className="h-3 w-3 mr-1" />
                <span>Início</span>
                <span className="mx-2">/</span>
                <span className="text-pizza-500">Cardápio</span>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex items-center">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline" className="ml-2 hidden md:flex">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue={activeCategory} onValueChange={handleCategoryChange} value={activeCategory}>
            <TabsList className="mb-6 flex flex-wrap bg-transparent h-auto p-0 space-x-2">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-pizza-500 data-[state=active]:text-white"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="tradicionais" 
                className="data-[state=active]:bg-pizza-500 data-[state=active]:text-white"
              >
                Pizzas Tradicionais
              </TabsTrigger>
              <TabsTrigger 
                value="premium" 
                className="data-[state=active]:bg-pizza-500 data-[state=active]:text-white"
              >
                Pizzas Premium
              </TabsTrigger>
              <TabsTrigger 
                value="doces" 
                className="data-[state=active]:bg-pizza-500 data-[state=active]:text-white"
              >
                Pizzas Doces
              </TabsTrigger>
              <TabsTrigger 
                value="bebidas" 
                className="data-[state=active]:bg-pizza-500 data-[state=active]:text-white"
              >
                Bebidas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeCategory} className="mt-0">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{item.rating}</span>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-pizza-500 font-bold">R$ {item.price.toFixed(2)}</span>
                          <Button 
                            onClick={() => addToCart(item)} 
                            size="sm" 
                            className="bg-pizza-500 hover:bg-pizza-600 text-white rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-xl font-medium">Nenhum item encontrado</h3>
                  <p className="text-gray-500 mt-2">Tente outra busca ou categoria</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Menu;
