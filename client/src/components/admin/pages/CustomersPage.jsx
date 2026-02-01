import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Star, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getUsers as getUsersApi } from '../../../services/userService';
import './CustomersPage.css';

const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af'];

function CustomersPage() {
  const [stats, setStats] = useState({
    totalCustomer: 0,
    newCustomer: 0,
    avgRating: 4.7,
    repeatCustomers: 67,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const users = await getUsersApi();
      const customerUsers = users.filter(u => u.user_type === 'customer') || [];
      setStats({
        totalCustomer: customerUsers.length,
        newCustomer: customerUsers.filter(u => {
          const created = new Date(u.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created >= monthAgo;
        }).length,
        avgRating: 4.7,
        repeatCustomers: 67,
      });
    } catch (error) {
      console.error('고객 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts
  const growthTrendData = [
    { month: 'JAN', value: 2000 },
    { month: 'FEB', value: 3000 },
    { month: 'MAR', value: 4000 },
    { month: 'APR', value: 5000 },
    { month: 'MAY', value: 6000 },
    { month: 'JUN', value: 7000 },
    { month: 'JUL', value: 8000 },
  ];

  const purchaseFrequencyData = [
    { frequency: 'Daily', value: 900 },
    { frequency: 'Weekly', value: 2700 },
    { frequency: 'Bi-weekly', value: 1800 },
    { frequency: 'Monthly', value: 900 },
  ];

  const ageDistributionData = [
    { name: '18-25', value: 2134 },
    { name: '26-35', value: 2856 },
    { name: '36-45', value: 1247 },
    { name: '46+', value: 1456 },
  ];

  const categoryPreferencesData = [
    { category: 'Fruits & Vegetables', value: 32 },
    { category: 'Dairy Products', value: 24 },
    { category: 'Meat & Seafood', value: 18 },
  ];

  if (loading) {
    return <div className="admin-page-loading">Loading...</div>;
  }

  return (
    <div className="admin-customers-page">
      {/* Stats Cards */}
      <div className="admin-grid admin-grid--stats">
        <StatCard icon={Users} label="Total Customer" value={stats.totalCustomer} change={15} />
        <StatCard icon={UserPlus} label="New Customer" value={stats.newCustomer} change={24} />
        <StatCard icon={Star} label="Avg. Rating" value={stats.avgRating} change={-0.3} />
        <StatCard icon={Repeat} label="Repeat Customers" value={`${stats.repeatCustomers}%`} change={8.2} />
      </div>

      {/* Charts */}
      <div className="admin-grid admin-grid--charts">
        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <div>
              <h3>Customer Growth Trends</h3>
              <p>$16,00.72 ↑ 6.20%</p>
            </div>
            <select className="admin-select">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} />
                <Line type="monotone" dataKey="value" stroke="#374151" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Purchase Frequency</h3>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="frequency" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Age Distribution</h3>
          </div>
          <div className="admin-chart admin-chart--donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-chart-donut__center">
              <strong>Total customer {stats.totalCustomer}</strong>
            </div>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Category Preferences</h3>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPreferencesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="category" type="category" stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change }) {
  return (
    <div className="admin-card admin-card--stat">
      <div className="admin-card__stat-icon">
        <Icon className="admin-icon" size={24} />
      </div>
      <div className="admin-card__stat-body">
        <div className="admin-card__label">{label}</div>
        <div className="admin-card__value">{value}</div>
        <div className={`admin-card__trend-badge ${change >= 0 ? 'is-positive' : 'is-negative'}`}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change >= 0 ? '+' : ''}{change}%
        </div>
        <div className="admin-card__secondary">
          {label.includes('last month') ? 'last month' : ''}
        </div>
      </div>
    </div>
  );
}


export default CustomersPage;

