import React from 'react';
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import './AdminSidebar.css';

const NAV_ITEMS = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'Order', label: 'Order', icon: ShoppingCart },
  { id: 'Inventory', label: 'Inventory', icon: Package },
  { id: 'Customers', label: 'Customers', icon: Users },
  { id: 'Report & Analytics', label: 'Report & Analytics', icon: BarChart3 },
  { id: 'Inquiries', label: 'Inquiries', icon: MessageCircle },
];

const OTHER_ITEMS = [
  { id: 'Settings', label: 'Settings', icon: Settings },
  { id: 'Help/Support', label: 'Help/Support', icon: HelpCircle },
];

function AdminSidebar({ activeNav, onNavChange, user, onLogout, onNavigateToStore }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo">
        <button
          type="button"
          onClick={onNavigateToStore}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            width: '100%',
          }}
        >
          NekoNoble Admin
        </button>
      </div>

      <nav className="admin-sidebar__nav">
        <div className="admin-sidebar__nav-section">
          <div className="admin-sidebar__nav-section-label">Main</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-sidebar__nav-item ${activeNav === item.id ? 'is-active' : ''}`}
                onClick={() => onNavChange(item.id)}
              >
                <div className="admin-sidebar__nav-bullet" />
                <Icon className="admin-icon" size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-sidebar__nav-section">
          <div className="admin-sidebar__nav-section-label">Other</div>
          {OTHER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-sidebar__nav-item ${activeNav === item.id ? 'is-active' : ''}`}
                onClick={() => onNavChange(item.id)}
              >
                <div className="admin-sidebar__nav-bullet" />
                <Icon className="admin-icon" size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-sidebar__footer">
        {user && (
          <div className="admin-user-card">
            <div className="admin-user-card__avatar">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="admin-user-card__name">{user.name || 'Admin User'}</div>
              <div className="admin-user-card__role">{user.email || 'admin@company.com'}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={onLogout}
          disabled={!user}
        >
          <LogOut className="admin-icon" size={18} style={{ marginRight: '0.5rem' }} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;

