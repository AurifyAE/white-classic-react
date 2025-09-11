import React from 'react';
import Sidebar from './sideBar';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/scrollTop';


const Layout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <ScrollToTop />

      <div className="flex-1 p-4">
        <Outlet /> {/* This will render the matched route's component */}
      </div>
    </div>
  );
};

export default Layout;