
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home, ArrowRight } from 'lucide-react';

const Promotions = () => {
  const promotions = [
    {
      id: 1,
      title: 'Combo Família',
      description: '2 pizzas grandes + refrigerante 2L + sobremesa',
      originalPrice: 149.90,
      promotionalPrice: 119.90,
      image: 'https://media.istockphoto.com/id/1349383878/photo/delicious-homemade-pepperoni-pizza.jpg?s=612x612&w=0&k=20&c=L75K9RpyCQ35UKzQ9aN-qnKH8orv-kCTEVJMLS0dCY8=',
      validUntil: '2024-05-30',
      tag: 'Economize R$ 30',
      color: 'from-pizza-600 to-pizza-700',
    },
    {
      id: 2,
      title: 'Pizza em Dobro',
      description: 'Compre uma pizza grande e ganhe outra do mesmo valor',
      originalPrice: 0,
      promotionalPrice: 0,
      image: 'https://media.istockphoto.com/id/1413684608/photo/four-seasons-pizza-on-wooden-board-white-background.jpg?s=612x612&w=0&k=20&c=w9LAOU_YoGj5p4CkNvxXE9VC-RpkCn0ZCMBS66AZuwE=',
      validUntil: '2024-05-30',
      tag: '2 por 1',
      color: 'from-amber-500 to-amber-600',
      daysValid: 'Terça e quarta',
    },
    {
      id: 3,
      title: 'Delivery Grátis',
      description: 'Em pedidos acima de R$ 70 nas quartas-feiras',
      originalPrice: 0,
      promotionalPrice: 0,
      image: 'https://img.freepik.com/premium-vector/delivery-man-scooter-with-city-background_23-2147682128.jpg',
      validUntil: '2024-05-30',
      tag: 'Toda quarta',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 4,
      title: 'Happy Hour',
      description: '20% de desconto em todas as pizzas das 15h às 18h',
      originalPrice: 0,
      promotionalPrice: 0,
      image: 'https://img.freepik.com/premium-photo/happy-hour-neon-sign-bar-cafe_34046-14.jpg',
      validUntil: '2024-05-30',
      tag: 'Todos os dias',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 5,
      title: 'Mega Promoção',
      description: 'Nos finais de semana, 30% off na segunda pizza',
      originalPrice: 0,
      promotionalPrice: 0,
      image: 'https://media.istockphoto.com/id/1349560792/photo/tasty-pepperoni-pizza-on-wooden-table.jpg?s=612x612&w=0&k=20&c=M6MYFr3UWjm_pDI0yOqrm6NLBnVX2gyhdhGWXmp6qOA=',
      validUntil: '2024-05-30',
      tag: 'Finais de semana',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <Layout>
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Promoções</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Home className="h-3 w-3 mr-1" />
              <span>Início</span>
              <span className="mx-2">/</span>
              <span className="text-pizza-500">Promoções</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <Card key={promo.id} className="overflow-hidden">
                <div className={`bg-gradient-to-r ${promo.color} text-white`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            {promo.daysValid || 'Por tempo limitado'}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{promo.title}</h3>
                        <p className="mb-4">{promo.description}</p>
                      </div>
                      
                      {promo.tag && (
                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {promo.tag}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-end mt-auto">
                      {promo.originalPrice > 0 && (
                        <div className="flex flex-col">
                          <span className="text-sm line-through opacity-75">
                            R$ {promo.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-3xl font-bold">
                            R$ {promo.promotionalPrice.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <Button className="ml-auto bg-white text-pizza-700 hover:bg-gray-100">
                        Aproveitar
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-0">
                  <img 
                    src={promo.image} 
                    alt={promo.title}
                    className="w-full h-48 object-cover"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="my-10 p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Regras e Condições</h2>
            <ul className="space-y-3 text-gray-700">
              <li>• Promoções válidas por tempo limitado e podem ser encerradas sem aviso prévio.</li>
              <li>• Não acumulativas com outras promoções ou descontos.</li>
              <li>• Promoção de pizza em dobro: a segunda pizza deve ser de valor igual ou menor à primeira.</li>
              <li>• Delivery grátis: válido apenas para endereços dentro do raio de 5km.</li>
              <li>• Happy Hour: válido apenas para pedidos realizados no horário especificado.</li>
              <li>• Consulte disponibilidade para sua região.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Promotions;
