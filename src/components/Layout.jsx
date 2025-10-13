import React from 'react';
import Sidebar from './sideBar';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/scrollTop';
import Footer from './footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar stays on left */}
        <Sidebar />

        {/* Main content with Outlet and Footer */}
        <div className="flex-1 flex flex-col">
          <ScrollToTop />

          {/* Page content (scrolls if needed) */}
          <main className="flex-1 p-4">
            <Outlet />
          </main>

          {/* Footer appears at bottom after content */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
