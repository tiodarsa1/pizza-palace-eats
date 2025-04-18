
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Smartphone } from 'lucide-react';

const AppDownload = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-center">
            <div className="p-8 md:p-12 md:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="text-pizza-500 h-6 w-6" />
                <h2 className="text-2xl md:text-3xl font-bold">Baixe nosso aplicativo</h2>
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                Faça pedidos mais rápido, acompanhe em tempo real e tenha acesso a ofertas exclusivas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-black hover:bg-gray-800 text-white px-6 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7z"></path><path d="M12 19v3"></path><path d="M8 3v4"></path><path d="M16 3v4"></path></svg>
                  <div className="flex flex-col items-start">
                    <span className="text-xs">Baixar na</span>
                    <span className="text-sm font-medium">App Store</span>
                  </div>
                </Button>
                <Button className="bg-black hover:bg-gray-800 text-white px-6 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <div className="flex flex-col items-start">
                    <span className="text-xs">Baixar no</span>
                    <span className="text-sm font-medium">Google Play</span>
                  </div>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 p-8 flex justify-center">
              <img 
                src="https://img.freepik.com/premium-vector/food-app-smartphone-screen-mobile-phone-frame-online-delivery-service-vector-mockup_8071-4331.jpg" 
                alt="App screen" 
                className="max-w-full h-auto object-cover rounded-lg shadow-lg"
                style={{ maxHeight: "400px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
