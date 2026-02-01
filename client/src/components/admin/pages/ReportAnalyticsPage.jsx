import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, CreditCard, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getRevenueTrend, getCategorySales, getTopProducts } from '../../../services/statisticsService';
import './ReportAnalyticsPage.css';

function ReportAnalyticsPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    avgOrderValue: 0,
    totalTransactions: 0,
    growthRate: 0,
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendData, categoryData, productsData] = await Promise.all([
        getRevenueTrend(),
        getCategorySales(),
        getTopProducts(),
      ]);

      setRevenueTrend(trendData || []);
      setCategorySales(categoryData || []);
      setTopProducts(productsData || []);

      const totalSales = trendData?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
      setStats({
        totalSales,
        avgOrderValue: totalSales / (trendData?.length || 1),
        totalTransactions: trendData?.length || 0,
        growthRate: 18.2,
      });
    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value || 0);
  };

  if (loading) {
    return <div className="admin-page-loading">Loading...</div>;
  }

  return (
    <div className="admin-report-page">
      {/* KPI Cards */}
      <div className="admin-grid admin-grid--kpi">
        <KPICard icon={DollarSign} label="Total Sales" value={formatCurrency(stats.totalSales)} change={18} color="green" />
        <KPICard icon={ShoppingCart} label="Avg. Order Value" value={formatCurrency(stats.avgOrderValue)} change={5.7} color="blue" />
        <KPICard icon={CreditCard} label="Total Transactions" value={stats.totalTransactions.toLocaleString()} change={12} color="purple" />
        <KPICard icon={BarChart3} label="Growth Rate" value={`${stats.growthRate}%`} change={3.4} color="red" />
      </div>

      {/* Charts */}
      <div className="admin-grid admin-grid--charts">
        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <div>
              <h3>Sales Performance Overview</h3>
              <p>$12,950.72 ↑ 6.20%</p>
            </div>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="admin-select">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#111827" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Top Selling Products</h3>
            <select className="admin-select">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="admin-product-list">
            {topProducts.slice(0, 1).map((product, index) => (
              <div key={index} className="admin-product-item">
                <div className="admin-product-item__image">📦</div>
                <div className="admin-product-item__info">
                  <div className="admin-product-item__name">{product.name}</div>
                  <div className="admin-product-item__meta">{product.quantity || 0} units sold</div>
                </div>
                <div className="admin-product-item__price">{formatCurrency(product.revenue || 0)}</div>
              </div>
            ))}
          </div>
          <div className="admin-chart" style={{ height: '200px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ day: 'TUE', value: 840 }, { day: 'WED', value: 2000 }, { day: 'THU', value: 2000 }, { day: 'FRI', value: 1200 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Sales by Category</h3>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="category" type="category" stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="sales" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <div>
              <h3>Hourly Sales Pattern</h3>
              <p>$12,950.72 ↑ 6.20%</p>
            </div>
            <select className="admin-select">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#111827" fillOpacity={1} fill="url(#colorHourly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, color }) {
  return (
    <div className="admin-card admin-card--kpi">
      <div className={`admin-card__stat-icon admin-card__stat-icon--${color}`}>
        <Icon className="admin-icon" size={24} />
      </div>
      <div className="admin-card__stat-body">
        <div className="admin-card__label">{label}</div>
        <div className="admin-card__value">{value}</div>
        <div className="admin-card__trend-badge is-positive">
          <TrendingUp size={14} />
          ↑ {change}% last period
        </div>
      </div>
    </div>
  );
}

export default ReportAnalyticsPage;

