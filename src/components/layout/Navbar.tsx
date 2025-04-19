import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Pizza, ShoppingCart, User, MapPin, Menu as MenuIcon, X, LogOut, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { getCartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    setCartCount(getCartCount());
  }, [getCartCount]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Pizza className="h-8 w-8 text-pizza-500" />
            <span className="text-xl font-bold text-pizza-500">PizzaPalace</span>
          </Link>

          {!isMobile && (
            <div className="flex items-center gap-2">
              <MapPin className="text-gray-500" size={18} />
              <span className="text-sm text-gray-700">Entrega para: Centro</span>
            </div>
          )}

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
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <User className="h-5 w-5 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Meus Pedidos</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" className="text-gray-700" onClick={() => setIsAuthDialogOpen(true)}>
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" className="text-gray-700" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </Button>
            </>
          )}
        </div>

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
            {isAuthenticated && (
              <Link 
                to="/orders" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} />
                  <span>Meus Pedidos</span>
                </div>
              </Link>
            )}
            {isAuthenticated ? (
              <button 
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span>Sair ({user?.name})</span>
                </div>
              </button>
            ) : (
              <button 
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-pizza-500"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAuthDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>Entrar / Cadastrar</span>
                </div>
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2">
              <MapPin className="text-gray-500" size={18} />
              <span className="text-sm text-gray-700">Entrega para: Centro</span>
            </div>
          </div>
        )}
      </div>
      
      <AuthDialog 
        open={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen}
      />
    </nav>
  );
};

export default Navbar;
