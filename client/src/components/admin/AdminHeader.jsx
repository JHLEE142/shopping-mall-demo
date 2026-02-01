import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import './AdminHeader.css';

const PAGE_CONFIG = {
  Dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Welcome back! Your grocery store\'s performance view.',
  },
  Order: {
    title: 'Order Management',
    subtitle: 'Track and manage all grocery orders in real time.',
  },
  Inventory: {
    title: 'Inventory Management',
    subtitle: 'Monitor stock levels and manage product inventory.',
  },
  Customers: {
    title: 'Customer Insights',
    subtitle: 'Analyze customer behavior, feedback, and demographics.',
  },
  'Report & Analytics': {
    title: 'Reports & Analytics',
    subtitle: 'Detailed sales reports, profit summaries, and monthly trends.',
  },
  Inquiries: {
    title: 'Inquiries Management',
    subtitle: 'Manage customer inquiries and provide responses.',
  },
};

function AdminHeader({ activeNav, user, onSearch }) {
  const config = PAGE_CONFIG[activeNav] || PAGE_CONFIG.Dashboard;

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <div className="admin-header__titles">
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
      </div>
      <div className="admin-header__right">
        <div className="admin-header__search">
          <Search className="admin-icon" size={20} />
          <input
            type="text"
            placeholder="Search users, orders, products..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
        <button type="button" className="admin-header__notification">
          <Bell className="admin-icon" size={20} />
        </button>
        <div className="admin-header__user">
          <div className="admin-header__user-avatar">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="admin-header__user-info">
            <div className="admin-header__user-name">{user?.name || 'Admin User'}</div>
            <div className="admin-header__user-email">{user?.email || 'admin@company.com'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

