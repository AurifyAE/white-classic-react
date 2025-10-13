import React from 'react';
import logo from '../assets/logo.jpg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <img 
            src={logo} 
            alt="Aurify Technologies Logo" 
            className="h-10 w-20 object-contain"
          />
          <span className="text-blue-600 font-semibold text-sm">
            © {currentYear} Powered by Aurify Technologies. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;