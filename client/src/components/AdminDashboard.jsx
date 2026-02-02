import React, { useState } from 'react';
import AdminSidebar from './admin/AdminSidebar';
import AdminHeader from './admin/AdminHeader';
import DashboardPage from './admin/pages/DashboardPage';
import OrderPage from './admin/pages/OrderPage';
import InventoryPage from './admin/pages/InventoryPage';
import CustomersPage from './admin/pages/CustomersPage';
import ReportAnalyticsPage from './admin/pages/ReportAnalyticsPage';
import InquiriesPage from './admin/pages/InquiriesPage';
import './AdminDashboard.css';

const NAV_ITEMS = ['Dashboard', 'Order', 'Inventory', 'Customers', 'Report & Analytics', 'Inquiries'];

function AdminDashboard({
  user,
  onNavigateToStore,
  onLogout,
  onAddProduct,
  initialNav = 'Dashboard',
  isLoggingOut = false,
}) {
  const [activeNav, setActiveNav] = useState(initialNav);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavChange = (nav) => {
    setActiveNav(nav);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const renderPage = () => {
    switch (activeNav) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Order':
        return <OrderPage />;
      case 'Inventory':
        return <InventoryPage onAddProduct={onAddProduct} />;
      case 'Customers':
        return <CustomersPage />;
      case 'Report & Analytics':
        return <ReportAnalyticsPage />;
      case 'Inquiries':
        return <InquiriesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        user={user}
        onLogout={onLogout}
        onNavigateToStore={onNavigateToStore}
      />
      <div className="admin-main">
        <AdminHeader
          activeNav={activeNav}
          user={user}
          onSearch={handleSearch}
        />
        <div className="admin-content">
          {renderPage()}
          </div>
          </div>
    </div>
  );
}

export default AdminDashboard;
