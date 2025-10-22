import React, { useState, useMemo, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Box,
  TrendingUp,
  Gem,
  Building,
  CircleDollarSign,
  RefreshCw,
  Sparkles,
  FileText,
  User,
  BarChart3,
  Activity,
  ClipboardList,
  Globe2,
  Database,
  Search,
  ShoppingCart,
  HandHeart,
  Package,
  Send,
  CreditCard,
  Banknote,
  Wallet2,
  MapPin,
  FolderTree,
  Tags,
  Layers,
  Type,
  Award,
  Truck,
  Flag,
  Ruler,
  Palette,
  BanknoteIcon,
  HandCoins,
  Building2,
  Tickets,
  ReceiptText,
  Captions,
  SquareUser,
  DollarSign,
  Vault,
  Repeat,
  Boxes,
  DatabaseBackup,
  Wallet2Icon,
  Wallet,
  FileChartLine,
  ChartNoAxesCombined,
  SquareActivity,
  BarChart,
  Folder,
  ListOrdered,
  ChartPie,
  ChartBar,
  ArrowUpDown,
  BaggageClaimIcon,
  LucidePenTool,
  Percent,
  Wrench,
  CircleFadingPlusIcon
} from "lucide-react";

import logo from "../assets/logo.jpg";
import axiosInstance from "../api/axios";
import { Tooltip } from "react-tooltip";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  // Log the current pathname for debugging
  useEffect(() => {
    console.log("Current pathname:", location.pathname);
  }, [location.pathname]);


  const isRouteActive = (to) => {
    const path = location.pathname;
    const profileType = location.state?.profileType;

    // For dynamic account routes
    if (to === "/trade-debtor") {
      return path === to || (path.startsWith("/accounts/") && profileType === "debtor");
    }

    if (to === "/parties") {
      return path === to || (path.startsWith("/accounts/") && profileType === "creditor");
    }

    // Handle dynamic segments
    const dynamicRoutes = [
      "/metal-purchase",
      "/metal-sale",
      "/purchase-return",
      "/sales-return",
      "/currency-receipt",
      "/currency-payment",
      "/metal-receipt",
      "/metal-payment",
      "/transfer",
      "/opening-balance"
    ];

    if (dynamicRoutes.includes(to)) {
      return path === to || path.startsWith(`${to}/`);
    }

    return path === to;
  };



  // Memoized navigation structure for better performance
  const navigationSections = useMemo(() => [
    {
      key: 'metalMaster',
      icon: <Box strokeWidth={1.5} size={22} />,
      text: 'Metal Master',
      children: [
        { icon: <Package strokeWidth={1.5} size={20} />, text: 'Metal Stock', to: '/metal-stock' },
        { icon: <TrendingUp strokeWidth={1.5} size={20} />, text: 'Metal Rate/Type', to: '/metal-rate-type' },
        { icon: <Gem strokeWidth={1.5} size={20} />, text: 'Karat Master', to: '/karat-master' },
        { icon: <Building strokeWidth={1.5} size={20} />, text: 'Division Master', to: '/division-master' },
      ]
    },
    {
      key: 'costCenterMaster',
      icon: <CircleDollarSign strokeWidth={1.5} size={22} />,
      text: 'Registry',
      children: [
        // { icon: <Gem strokeWidth={1.5} size={20} />, text: 'Gold', to: '/gold' },
        { icon: <Package strokeWidth={1.5} size={20} />, text: 'Stock Balance', to: '/stock-balance' },
        { icon: <DollarSign strokeWidth={1.5} size={20} />, text: 'Charges', to: '/charge' },
        { icon: <Sparkles strokeWidth={1.5} size={20} />, text: 'Premium / Discount', to: '/premium-discount' },
        { icon: <Percent strokeWidth={1.5} size={20} />, text: 'VAT', to: '/vat' },
        { icon: <CircleFadingPlusIcon strokeWidth={1.5} size={20} />, text: 'Others', to: '/others' },
        { icon: <Send strokeWidth={1.5} size={20} />, text: 'Sales Fix', to: '/sales-fix-management' },
        { icon: <ShoppingCart strokeWidth={1.5} size={20} />, text: 'Purchase Fix', to: '/purchase-fix-management' },
        { icon: <BanknoteIcon strokeWidth={1.5} size={20} />, text: 'currency Fix', to: '/currencyfix-management' },

        // { icon: <FileText strokeWidth={1.5} size={20} />, text: 'Expense', to: '/expense' },

      ]
    },
    {
      key: 'categoryMaster',
      icon: <FolderTree strokeWidth={1.5} size={22} />,
      text: 'Category Master',
      children: [
        { icon: <Tags strokeWidth={1.5} size={20} />, text: 'Main Category', to: '/main-category' },
        { icon: <Layers strokeWidth={1.5} size={20} />, text: 'Sub Category', to: '/sub-category' },
        { icon: <Type strokeWidth={1.5} size={20} />, text: 'Type Master', to: '/type-master' },
      ]
    },
    {
      key: 'productMaster',
      icon: <Award strokeWidth={1.5} size={22} />,
      text: 'Product Master',
      children: [
        { icon: <Award strokeWidth={1.5} size={20} />, text: 'Brand Master', to: '/brand-master' },
        { icon: <Ruler strokeWidth={1.5} size={20} />, text: 'Size Master', to: '/size-master' },
        { icon: <Palette strokeWidth={1.5} size={20} />, text: 'Color Master', to: '/color-master' },
      ]
    },

    // {
    //   key: 'businessMaster',
    //   icon: <Truck strokeWidth={1.5} size={22} />,
    //   text: 'Business Master',
    //   children: [
    //     { icon: <Truck strokeWidth={1.5} size={20} />, text: 'Vendor Master', to: '/vendor-master' },
    //     { icon: <Flag strokeWidth={1.5} size={20} />, text: 'Country Master', to: '/country-master' },
    //     { icon: <MapPin strokeWidth={1.5} size={20} />, text: 'Branch Master', to: '/branch-master' },
    //   ]
    // },

    {
      key: 'chartAccounts',
      icon: <Database strokeWidth={1.5} size={22} />,
      text: 'Accounts',
      children: [
        { icon: <User strokeWidth={1.5} size={20} />, text: 'Parties', to: '/parties' },
        { icon: <Vault strokeWidth={1.5} size={20} />, text: 'Account Type', to: '/account-type' },
      ]
    },
    {
      key: 'generalMaster',
      icon: <Globe2 strokeWidth={1.5} size={22} />,
      text: 'General Master',
      children: [
        { icon: <DollarSign strokeWidth={1.5} size={20} />, text: 'Currency Master', to: '/currency-master' },
        { icon: <CircleDollarSign strokeWidth={1.5} size={20} />, text: 'Cost Center', to: '/cost-center' },

        { icon: <Tickets strokeWidth={1.5} size={20} />, text: 'Voucher', to: '/voucher' },

      ]
    },
    {
      key: 'metalTransaction',
      icon: <ShoppingCart strokeWidth={1.5} size={22} />,
      text: 'Metal Transaction',
      children: [
        { icon: <ShoppingCart strokeWidth={1.5} size={20} />, text: 'Purchase Fixing', to: '/purchase-fixing' },
        { icon: <HandHeart strokeWidth={1.5} size={20} />, text: 'Sales Fixing', to: '/sales-fixing' },
        { icon: <Package strokeWidth={1.5} size={20} />, text: 'Purchase Metal', to: '/metal-purchase' },
        { icon: <Send strokeWidth={1.5} size={20} />, text: 'Sales Metal', to: '/metal-sale' },
        { icon: <Package strokeWidth={1.5} size={20} />, text: 'Purchase return', to: '/purchase-return' },
        { icon: <Send strokeWidth={1.5} size={20} />, text: 'Sales Return', to: '/sales-return' },
      ]
    },
    {
      key: 'inventoryManagement',
      icon: <Box strokeWidth={1.5} size={22} />,
      text: 'Inventory Management',
      children: [
        { icon: <Package strokeWidth={1.5} size={20} />, text: 'Metals', to: '/inventory/metals', },
      ]
    },

    {
      key: 'financialTransaction',
      icon: <Wallet2 strokeWidth={1.5} size={22} />,
      text: 'Financial Transaction',
      children: [
        { icon: <CreditCard strokeWidth={1.5} size={20} />, text: 'Currency Fix ', to: '/currency-fix' },
        { icon: <ReceiptText strokeWidth={1.5} size={20} />, text: 'Currency Receipt', to: '/currency-receipt' },
        { icon: <Banknote strokeWidth={1.5} size={20} />, text: 'Currency Payment', to: '/currency-payment' },
        { icon: <Captions strokeWidth={1.5} size={20} />, text: 'Metal Receipt', to: '/metal-receipt' },
        { icon: <CreditCard strokeWidth={1.5} size={20} />, text: 'Metal Payment', to: '/metal-payment' },
        { icon: <Repeat strokeWidth={1.5} size={20} />, text: 'Transfer', to: '/transfer' },
        { icon: <DollarSign strokeWidth={1.5} size={20} />, text: 'Opening Balance', to: '/opening-balance' }

      ]
    },
    {
      key: 'Reports',
      icon: <Wallet strokeWidth={1.5} size={22} />,
      text: 'Reports',
      children: [
        { icon: <Database strokeWidth={1.5} size={20} />, text: 'Metal Stock Ledger', to: '/reports/metal-stock-ledger' },
        { icon: <ArrowUpDown strokeWidth={1.5} size={20} />, text: 'Stock Movement', to: '/reports/stock-movement' },
        { icon: <BaggageClaimIcon strokeWidth={1.5} size={20} />, text: 'Stock Balance', to: '/reports/stock-balance' },
        { icon: <ChartBar strokeWidth={1.5} size={20} />, text: 'Stock Analysis', to: '/reports/stock-analysis' },
        { icon: <ChartPie strokeWidth={1.5} size={20} />, text: 'Sales Analysis', to: '/reports/sales-analysis' },
        { icon: <DollarSign strokeWidth={1.5} size={20} />, text: 'Fixing Registry', to: '/reports/fixing-registry' },
        { icon: <ListOrdered strokeWidth={1.5} size={20} />, text: 'Transaction Summary', to: '/reports/transaction-summary' },
        { icon: <Folder strokeWidth={1.5} size={20} />, text: 'Statement of Account', to: '/reports/statements' },
        { icon: <Folder strokeWidth={1.5} size={20} />, text: 'Own Stock currency', to: '/reports/own-stock/currency' },
        { icon: <Folder strokeWidth={1.5} size={20} />, text: 'Own Stock', to: '/reports/own-stock' },
      ]
    }
  ], []);

  // Function to find which section contains the current route
  const findActiveSection = (currentPath) => {
    for (const section of navigationSections) {
      const hasActiveChild = section.children.some(child =>
        child.to === currentPath || (child.to === '/trade-debtor' && currentPath.startsWith('/accounts/'))
      );
      if (hasActiveChild) {
        console.log(`Active section found: ${section.key}`);
        return section.key;
      }
    }
    console.log("No active section found");
    return null;
  };

  // Function to check if a section has an active child
  // const hasActiveChild = (section) => {
  //   return section.children.some(child => child.to === location.pathname);
  // };
  // const hasActiveChild = (section) => {
  //   const isActive = section.children.some(child => 
  //     child.to === location.pathname || 
  //     (child.to === '/trade-debtor' && location.pathname.startsWith('/accounts/')) ||
  //     (child.to === '/trade-creditors' && location.pathname.startsWith('/accounts/'))
  //   );
  //   console.log(`Section ${section.key} hasActiveChild: ${isActive}`);
  //   return isActive;
  // };

  const hasActiveChild = (section) => {
    const path = location.pathname;
    const profileType = location.state?.profileType;

    return section.children.some(child =>
      child.to === path ||
      (child.to === "/trade-debtor" && path.startsWith("/accounts/") && profileType === "debtor") ||
      (child.to === "/trade-creditors" && path.startsWith("/accounts/") && profileType === "creditor")
    );
  };


  // Auto-expand sections with active children on route change
  useEffect(() => {
    const activeSection = findActiveSection(location.pathname);
    if (activeSection) {
      setExpandedSections(prev => ({
        ...prev,
        [activeSection]: true
      }));
    }
  }, [location.pathname]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    toast.info("Logging out...", {
      position: "top-right",
      autoClose: 1500,
    });

    try {
      // 🔒 Call backend to clear refresh token cookie
      await axiosInstance.post("/logout"); // Your /logout route

      // ✅ Now clear client-side stuff
      localStorage.removeItem("token");
      localStorage.removeItem("adminId");
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("refreshToken");
      navigate("/");

      setTimeout(() => {
        toast.success("Logged out successfully", {
          position: "top-right",
          autoClose: 2000,
        });
        navigate("/");
      }, 800);
    } catch (error) {
      toast.error("Logout failed!", {
        position: "top-right",
      });
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="w-auto bg-white shadow-lg flex flex-col">
      <div className="">
        <img src={logo} alt="Bullion System Logo" className="w-56 -mt-14 ml-7" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 -mt-16 py-4 scrollbar-hide">
        <nav className="space-y-2">
          {/* <SidebarItem
            icon={<LayoutDashboard strokeWidth={1.5} size={22} />}
            text="Dashboard"
            to="/dashboard"
            active={location.pathname === "/dashboard"}
          /> */}
          {navigationSections.map((section) => (
            <div key={section.key}>
              <SidebarSection
                icon={section.icon}
                text={section.text}
                sectionKey={section.key}
                expanded={expandedSections[section.key]}
                onToggle={() => toggleSection(section.key)}
                hasActiveChild={hasActiveChild(section)}
              >
                {section.children.map((child, index) => (
                  <SidebarSubItem
                    key={`${section.key}-${index}`}
                    icon={child.icon}
                    text={child.text}
                    to={child.to}
                    active={isRouteActive(child.to)}
                  />
                ))}
              </SidebarSection>
              {section.key === 'generalMaster' && (
                <>
                  <Link to="/ceditors" className="block">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${location.pathname === "/ceditors"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-md"
                        : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <HandCoins strokeWidth={1.5} size={22} />
                      <span className="font-medium flex-1 truncate">Ceditors Management</span>
                      <ChevronRight strokeWidth={1.5} size={18} />
                    </div>
                  </Link>
                  <Link to="/debtor" className="block">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${location.pathname === "/debtor"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-md"
                        : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <Wallet2 strokeWidth={1.5} size={22} />
                      <span className="font-medium flex-1 truncate">Debtor Management</span>
                      <ChevronRight strokeWidth={1.5} size={18} />
                    </div>
                  </Link>
                </>
              )}
            </div>
          ))}
          <div className="pt-6">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
              System Settings
            </div>
            <SidebarItem
              icon={<Shield strokeWidth={1.5} size={22} />}
              text="Security"
              to="/security"
              active={location.pathname === "/security"}
            />
            <SidebarItem
              icon={<Settings strokeWidth={1.5} size={22} />}
              text="Settings"
              to="/settings"
              active={location.pathname === "/settings"}
            />
          </div>
        </nav>
      </div>
      <div className="flex-shrink-0 border-t border-gray-100 p-4 space-y-2">
        <SidebarItem
          icon={<HelpCircle strokeWidth={1.5} size={22} />}
          text="Help Center"
          to="/help-center"
          active={location.pathname === "/help-center"}
        />
        <div onClick={handleLogout} className="cursor-pointer">
          <div className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-all">
            <LogOut strokeWidth={1.5} size={22} />
            <span className="font-medium">Log Out</span>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="text-sm"
      />
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;
        }
      `}</style>
    </div>
  );
};

// Optimized components with React.memo for better performance
const SidebarItem = React.memo(({ icon, text, to, active }) => (
  <Link to={to} className="block">
    <div
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${active
        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-md"
        : "text-slate-700 hover:bg-slate-100"
        }`}
    >
      {icon}
      <span className="font-medium truncate">{text}</span>
    </div>
  </Link>
));

const SidebarSection = React.memo(({ icon, text, children, expanded, onToggle, hasActiveChild }) => (
  <div className="w-full">
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${hasActiveChild
        ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 font-medium"
        : "text-slate-700 hover:bg-slate-100"
        }`}
    >
      {icon}
      <span className="font-medium flex-1 truncate">{text}</span>
      <div className="transform transition-transform duration-200">
        {expanded ? (
          <ChevronDown strokeWidth={1.5} size={18} />
        ) : (
          <ChevronRight strokeWidth={1.5} size={18} />
        )}
      </div>
    </div>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
    >
      <div className="ml-4 mt-1 space-y-1">
        {children}
      </div>
    </div>
  </div>
));

const SidebarSubItem = React.memo(({ icon, text, to, active }) => (
  <Link to={to} className="block">
    <div
      className={`flex items-center gap-3 p-2 pl-6 rounded-lg cursor-pointer transition-all duration-200 ${active
        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-700"
        }`}
    >
      {icon}
      <span className="font-medium text-sm truncate">{text}</span>
    </div>
  </Link>
));

// Add display names for better debugging
SidebarItem.displayName = 'SidebarItem';
SidebarSection.displayName = 'SidebarSection';
SidebarSubItem.displayName = 'SidebarSubItem';

export default Sidebar;

