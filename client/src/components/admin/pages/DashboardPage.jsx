import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  getDashboardStats,
  getRevenueTrend,
  getCategorySales,
  getTopProducts,
} from '../../../services/statisticsService';
import { fetchOrders as fetchOrdersApi } from '../../../services/orderService';
import './DashboardPage.css';

const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendData, categoryData, productsData, ordersData] = await Promise.all([
        getDashboardStats(),
        getRevenueTrend(),
        getCategorySales(),
        getTopProducts(),
        fetchOrdersApi({ page: 1, limit: 5 }),
      ]);

      setStats(statsData);
      // revenueTrend는 배열로 직접 반환됨
      setRevenueTrend(Array.isArray(trendData) ? trendData : []);
      // categorySales는 배열로 직접 반환됨
      setCategorySales(Array.isArray(categoryData) ? categoryData : []);
      // topProducts는 배열로 직접 반환됨
      setTopProducts(Array.isArray(productsData) ? productsData : []);
      // API 응답 형식: { page, limit, totalItems, totalPages, items }
      setRecentOrders(ordersData.items || ordersData.orders || []);
    } catch (error) {
      console.error('Dashboard 데이터 로드 실패:', error);
      // 기본값 설정
      setStats({
        totalRevenue: 0,
        recentRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        recentOrdersCount: 0,
        ordersChange: 0,
        totalCustomers: 0,
        recentCustomers: 0,
        customersChange: 0,
        totalProducts: 0,
        recentProducts: 0,
        productsChange: 0,
      });
      setRevenueTrend([]);
      setCategorySales([]);
      setTopProducts([]);
      setRecentOrders([]);
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

  const formatNumber = (value) => {
    return new Intl.NumberFormat('ko-KR').format(value || 0);
  };

  const formatChange = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* KPI Cards */}
      <div className="admin-grid admin-grid--kpi">
        <KPICard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.revenueChange || 0}
          trend={stats?.revenueChange >= 0}
        />
        <KPICard
          icon={ShoppingCart}
          label="Total Orders"
          value={formatNumber(stats?.totalOrders || 0)}
          change={stats?.ordersChange || 0}
          trend={stats?.ordersChange >= 0}
        />
        <KPICard
          icon={Package}
          label="Total Product"
          value={formatNumber(stats?.totalProducts || 0)}
          change={stats?.productsChange || 0}
          trend={stats?.productsChange >= 0}
        />
        <KPICard
          icon={Users}
          label="Active Customers"
          value={formatNumber(stats?.totalCustomers || 0)}
          change={stats?.customersChange || 0}
          trend={stats?.customersChange >= 0}
        />
      </div>

      {/* Charts Row */}
      <div className="admin-grid admin-grid--charts">
        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <div>
              <h2>Sales By Category</h2>
              <p>{formatCurrency(revenueTrend.reduce((sum, item) => sum + (item.revenue || 0), 0))}</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="admin-select"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111827"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card admin-card--chart">
          <div className="admin-card__header">
            <h3>Sales By Category</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="admin-select"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="admin-chart admin-chart--donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="sales"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-chart-donut__center">
              <strong>{formatNumber(categorySales.reduce((sum, item) => sum + (item.sales || 0), 0))}</strong>
              <span>+45%</span>
            </div>
          </div>
          <div className="admin-chart-donut__legend">
            {categorySales.map((item, index) => (
              <div key={index} className="admin-chart-donut__legend-item">
                <div
                  className="admin-chart-donut__marker"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span>{item.category}: {formatNumber(item.sales || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div className="admin-grid admin-grid--lists">
        <div className="admin-card">
          <div className="admin-card__header">
            <h3>Top Products</h3>
            <select className="admin-select">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="admin-product-list">
            {topProducts.slice(0, 3).map((product, index) => (
              <div key={index} className="admin-product-item">
                <div className="admin-product-item__image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="admin-product-item__placeholder">📦</div>
                  )}
                </div>
                <div className="admin-product-item__info">
                  <div className="admin-product-item__name">{product.name}</div>
                  <div className="admin-product-item__meta">
                    {formatNumber(product.quantity || 0)} sold
                  </div>
                </div>
                <div className="admin-product-item__price">
                  {formatCurrency(product.revenue || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <h3>Recent Order</h3>
            <button type="button" className="admin-button admin-button--secondary">
              Filter
            </button>
          </div>
          <div className="admin-table admin-table--recent">
            <div className="admin-table__header">
              <span>#</span>
              <span>Product</span>
              <span>Date</span>
              <span>Status</span>
              <span>Price</span>
              <span>Customer</span>
            </div>
            <div className="admin-table__body">
              {recentOrders.slice(0, 3).map((order, index) => (
                <div key={order._id || index} className="admin-table__row">
                  <span>{index + 1}</span>
                  <span>
                    {order.items?.[0]?.product?.name || 'N/A'}
                  </span>
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </span>
                  <span>
                    <span className={`admin-badge admin-badge--${order.status || 'pending'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </span>
                  <span>{formatCurrency(order.summary?.grandTotal || order.payment?.amount || 0)}</span>
                  <span>{order.user?.name || order.user?.email || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, trend }) {
  // Generate mock mini chart data
  const miniChartData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.random() * 100 + 50,
  }));

  return (
    <div className="admin-card admin-card--kpi">
      <div className="admin-card__stat-icon">
        <Icon className="admin-icon" size={24} />
      </div>
      <div className="admin-card__stat-body">
        <div className="admin-card__label">{label}</div>
        <div className="admin-card__value">{value}</div>
        <div className={`admin-card__trend-badge ${trend ? 'is-positive' : 'is-negative'}`}>
          {trend ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {formatChange(change)} this week
        </div>
      </div>
      <div className="admin-card__mini-chart">
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={miniChartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trend ? '#111827' : '#6b7280'}
              fill={trend ? '#111827' : '#9ca3af'}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatChange(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default DashboardPage;

