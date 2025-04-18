
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface PizzaItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  popular?: boolean;
}

const PopularItems = () => {
  const popularPizzas: PizzaItem[] = [
    {
      id: 1,
      name: 'Margherita',
      description: 'Molho de tomate, mussarela, manjericão e orégano.',
      price: 39.90,
      image: 'https://static.itdg.com.br/images/1200-675/b6bc1b63298f30d84ac1d2ff50c1c0fc/pizza-margherita.jpg',
      rating: 4.8,
      popular: true,
    },
    {
      id: 2,
      name: 'Pepperoni',
      description: 'Molho de tomate, mussarela, pepperoni e orégano.',
      price: 44.90,
      image: 'https://img.taste.com.au/w_-0kcUJ/w720-h480-cfill-q80/taste/2016/11/easy-pepperoni-pizza-74425-1.jpeg',
      rating: 4.9,
      popular: true,
    },
    {
      id: 3,
      name: 'Quatro Queijos',
      description: 'Molho de tomate, mussarela, provolone, parmesão e gorgonzola.',
      price: 47.90,
      image: 'https://www.receiteria.com.br/wp-content/uploads/receitas-de-pizza-quatro-queijos-1.jpg',
      rating: 4.7,
      popular: true,
    },
    {
      id: 4,
      name: 'Calabresa',
      description: 'Molho de tomate, mussarela, calabresa, cebola e orégano.',
      price: 42.90,
      image: 'https://img.freepik.com/premium-photo/freshly-baked-pizza-calabrese-salame-wooden-board-italian-cuisine_252080-38.jpg',
      rating: 4.6,
      popular: true,
    },
  ];

  const handleAddToCart = (item: PizzaItem) => {
    toast.success(`${item.name} adicionada ao carrinho!`);
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">Mais Pedidas</h2>
        <p className="text-gray-600 text-center mb-8">As favoritas dos nossos clientes</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularPizzas.map((pizza) => (
            <Card key={pizza.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={pizza.image} 
                  alt={pizza.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{pizza.rating}</span>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{pizza.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pizza.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-pizza-500 font-bold">R$ {pizza.price.toFixed(2)}</span>
                  <Button 
                    onClick={() => handleAddToCart(pizza)} 
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
      </div>
    </section>
  );
};

export default PopularItems;
