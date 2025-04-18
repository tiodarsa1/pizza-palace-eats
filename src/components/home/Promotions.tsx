
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

const Promotions = () => {
  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Ofertas Especiais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Promotion 1 */}
          <div className="bg-gradient-to-r from-pizza-600 to-pizza-700 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 text-white flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Por tempo limitado</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Combo Família</h3>
              <p className="mb-4">2 pizzas grandes + refrigerante 2L + sobremesa</p>
              <div className="flex items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-sm line-through opacity-75">R$ 149,90</span>
                  <span className="text-3xl font-bold">R$ 119,90</span>
                </div>
                <Button className="ml-auto bg-white text-pizza-700 hover:bg-gray-100">
                  Aproveitar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Promotion 2 */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 text-white flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Terça e quarta</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Pizza em Dobro</h3>
              <p className="mb-4">Compre uma pizza grande e ganhe outra do mesmo valor</p>
              <div className="flex items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">2 por 1</span>
                  <span className="text-sm">*Consulte regras</span>
                </div>
                <Button className="ml-auto bg-white text-amber-600 hover:bg-gray-100">
                  Ver detalhes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Promotions;
