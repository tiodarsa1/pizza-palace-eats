
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Pizza, ShoppingCart, User, MapPin, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Pizza className="h-8 w-8 text-pizza-500" />
            <span className="text-xl font-bold text-pizza-500">PizzaPalace</span>
          </Link>

          {/* Delivery Location - Hidden on Mobile */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <MapPin className="text-gray-500" size={18} />
              <span className="text-sm text-gray-700">Entrega para: Centro</span>
            </div>
          )}

          {/* Desktop Navigation */}
          {!isMobile ? (
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-700 hover:text-pizza-500 transition-colors">
                Início
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-pizza-500 transition-colors">
                Cardápio
              </Link>
              <Link to="/promotions" className="text-gray-700 hover:text-pizza-500 transition-colors">
                Promoções
              </Link>
              <Link to="/cart" className="relative">
                <Button variant="outline" className="border-pizza-500 text-pizza-500 hover:bg-pizza-50">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Carrinho
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pizza-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" className="text-gray-700">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Menu Button */}
              <Button variant="ghost" className="text-gray-700" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && isMenuOpen && (
          <div className="mt-3 space-y-2 py-2 border-t">
            <Link 
              to="/" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Home size={18} />
                <span>Início</span>
              </div>
            </Link>
            <Link 
              to="/menu" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Pizza size={18} />
                <span>Cardápio</span>
              </div>
            </Link>
            <Link 
              to="/promotions" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Pizza size={18} />
                <span>Promoções</span>
              </div>
            </Link>
            <Link 
              to="/cart" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} />
                <span>Carrinho {cartCount > 0 && `(${cartCount})`}</span>
              </div>
            </Link>
            <Link 
              to="/profile" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <User size={18} />
                <span>Perfil</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2">
              <MapPin className="text-gray-500" size={18} />
              <span className="text-sm text-gray-700">Entrega para: Centro</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
