
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-pizza-950 to-pizza-800 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'4\'/%3E%3Ccircle cx=\'52\' cy=\'52\' r=\'4\'/%3E%3C/g%3E%3C/svg%3E")',
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              A melhor pizza da cidade, entregue na sua porta
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Sabor autêntico italiano com ingredientes frescos e de qualidade. Entrega rápida e segura para você aproveitar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/menu">
                <Button className="bg-pizza-500 hover:bg-pizza-600 text-white px-6 py-6 rounded-full text-lg">
                  Ver Cardápio <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" className="border-white hover:bg-white/10 text-white px-6 py-6 rounded-full text-lg">
                Promoções
              </Button>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center items-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
              <div className="absolute inset-0 rounded-full bg-pizza-500/20 blur-xl"></div>
              <img 
                src="https://png.pngtree.com/png-clipart/20230412/original/pngtree-realistic-delicious-pizza-png-image_9048855.png" 
                alt="Pizza deliciosa" 
                className="relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
