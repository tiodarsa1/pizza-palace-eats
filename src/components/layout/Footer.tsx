
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Us */}
          <div>
            <h3 className="text-lg font-bold mb-4">Pizza Palace</h3>
            <p className="text-gray-300 text-sm">
              Trazendo o melhor da pizza italiana direto para sua casa. Qualidade, sabor e entrega rápida!
            </p>
            <div className="flex mt-4 space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Início</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-white transition-colors">Cardápio</Link>
              </li>
              <li>
                <Link to="/promotions" className="hover:text-white transition-colors">Promoções</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Sobre Nós</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center">
                <Phone size={16} className="mr-2" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2" />
                <span>contato@pizzapalace.com</span>
              </li>
              <li className="flex items-start">
                <MapPin size={16} className="mr-2 mt-1" />
                <span>Av. Paulista, 1000, São Paulo - SP</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-bold mb-4">Horário de Funcionamento</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <span>Segunda - Sexta:</span>
                <span>11:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado:</span>
                <span>11:00 - 00:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo:</span>
                <span>11:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Pizza Palace. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
