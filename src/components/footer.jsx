import React from 'react';
// import logo from '../assets/logo.jpg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-3">

          <span className="text-gray-700  text-sm hover:cursor-pointer">
            © {currentYear} Powered by{' '}
            <a

              href="https://aurify.ae"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Aurify Technologies
            </a>
            . All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;