import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Star, Repeat, TrendingUp, TrendingDown, Search, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getUsers as getUsersApi, getUserById } from '../../../services/userService';
import { fetchOrders as fetchOrdersApi } from '../../../services/orderService';
import { getStatisticsData as getStatisticsDataApi } from '../../../services/statisticsService';
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
  const [customers, setCustomers] = useState([]);
  const [growthTrendData, setGrowthTrendData] = useState([]);
  const [purchaseFrequencyData, setPurchaseFrequencyData] = useState([]);
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [categoryPreferencesData, setCategoryPreferencesData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 고객 목록 로드
      const usersData = await getUsersApi({ page, limit: 20, user_type: 'customer' });
      const users = usersData.items || (Array.isArray(usersData) ? usersData : []);
      const customerUsers = users.filter(u => u.user_type === 'customer') || [];
      
      // 검색 필터 적용
      let filteredCustomers = customerUsers;
      if (searchQuery) {
        filteredCustomers = customerUsers.filter(u => 
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setCustomers(filteredCustomers);
      setPagination({
        totalPages: usersData.totalPages || 1,
        totalItems: usersData.totalItems || filteredCustomers.length,
      });

      // 전체 고객 수 계산
      const allUsersData = await getUsersApi({ page: 1, limit: 1000, user_type: 'customer' });
      const allUsers = allUsersData.items || [];
      const allCustomerUsers = allUsers.filter(u => u.user_type === 'customer') || [];
      
      // 신규 고객 수 계산
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const newCustomers = allCustomerUsers.filter(u => {
        const created = new Date(u.createdAt);
        return created >= monthAgo;
      }).length;

      // 주문 데이터로 재방문 고객 계산
      const ordersData = await fetchOrdersApi({ limit: 1000 });
      const allOrders = ordersData.items || [];
      const customerOrderMap = new Map();
      allOrders.forEach(order => {
        if (order.user && order.user._id) {
          const userId = order.user._id.toString();
          customerOrderMap.set(userId, (customerOrderMap.get(userId) || 0) + 1);
        }
      });
      const repeatCustomerCount = Array.from(customerOrderMap.values()).filter(count => count > 1).length;
      const repeatCustomerPercent = allCustomerUsers.length > 0 
        ? Math.round((repeatCustomerCount / allCustomerUsers.length) * 100) 
        : 0;

      // 통계 데이터 로드
      const statsData = await getStatisticsDataApi();
      
      // 고객 성장 추이 데이터
      if (statsData && statsData.monthlyStats) {
        const trendData = statsData.monthlyStats.map(stat => ({
          month: stat.month,
          value: stat.customers || 0,
        }));
        setGrowthTrendData(trendData);
      }

      // 주문 빈도 데이터 계산
      const frequencyMap = new Map();
      allOrders.forEach(order => {
        if (order.user && order.user._id) {
          const userId = order.user._id.toString();
          const count = customerOrderMap.get(userId) || 0;
          if (count === 1) frequencyMap.set('Once', (frequencyMap.get('Once') || 0) + 1);
          else if (count <= 3) frequencyMap.set('2-3 times', (frequencyMap.get('2-3 times') || 0) + 1);
          else if (count <= 5) frequencyMap.set('4-5 times', (frequencyMap.get('4-5 times') || 0) + 1);
          else frequencyMap.set('6+ times', (frequencyMap.get('6+ times') || 0) + 1);
        }
      });
      setPurchaseFrequencyData([
        { frequency: 'Once', value: frequencyMap.get('Once') || 0 },
        { frequency: '2-3 times', value: frequencyMap.get('2-3 times') || 0 },
        { frequency: '4-5 times', value: frequencyMap.get('4-5 times') || 0 },
        { frequency: '6+ times', value: frequencyMap.get('6+ times') || 0 },
      ]);

      // 나이 분포 (실제 데이터가 없으므로 기본값 유지)
      setAgeDistributionData([
        { name: '18-25', value: Math.floor(allCustomerUsers.length * 0.3) },
        { name: '26-35', value: Math.floor(allCustomerUsers.length * 0.4) },
        { name: '36-45', value: Math.floor(allCustomerUsers.length * 0.2) },
        { name: '46+', value: Math.floor(allCustomerUsers.length * 0.1) },
      ]);

      // 카테고리 선호도 (주문 데이터 기반)
      const categoryMap = new Map();
      allOrders.forEach(order => {
        order.items?.forEach(item => {
          const category = item.product?.category || item.category || '기타';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
      });
      const topCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, value]) => ({ category, value }));
      setCategoryPreferencesData(topCategories);

      setStats({
        totalCustomer: allCustomerUsers.length,
        newCustomer: newCustomers,
        avgRating: 4.7, // 리뷰 데이터가 있으면 실제 값 사용
        repeatCustomers: repeatCustomerPercent,
      });
    } catch (error) {
      console.error('고객 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCustomerClick = async (customerId) => {
    try {
      setLoadingDetails(true);
      const data = await getUserById(customerId);
      setCustomerDetails(data.user || data);
      setSelectedCustomer(customerId);
    } catch (error) {
      console.error('고객 정보 로드 실패:', error);
      alert('고객 정보를 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

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

      {/* Customer List */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>Customer List</h3>
          <div className="admin-card__header-actions">
            <div className="admin-search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-page-loading">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>고객이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="admin-table admin-table--customers">
              <div className="admin-table__header">
                <span>Name</span>
                <span>Email</span>
                <span style={{ minWidth: '120px' }}>User Type</span>
                <span style={{ minWidth: '150px' }}>Joined Date</span>
                <span>Status</span>
              </div>
              <div className="admin-table__body">
                {customers.map((customer) => (
                  <div key={customer._id} className="admin-table__row">
                    <div className="admin-table__cell-customer">
                      <div className="admin-table__customer-avatar">
                        {customer.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomerClick(customer._id)}
                        className="admin-table__customer-name"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                          color: '#111827',
                          textDecoration: 'underline',
                          fontSize: 'inherit',
                          fontFamily: 'inherit',
                        }}
                      >
                        {customer.name || 'Unknown'}
                      </button>
                    </div>
                    <div>{customer.email || '-'}</div>
                    <div style={{ minWidth: '120px' }}>
                      <span className="admin-badge admin-badge--default">
                        {customer.user_type || 'customer'}
                      </span>
                    </div>
                    <div style={{ minWidth: '150px' }}>{formatDate(customer.createdAt)}</div>
                    <div>
                      <span className="admin-badge admin-badge--success">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <div className="admin-pagination__pages">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`admin-pagination__page ${page === pageNum ? 'is-active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="admin-pagination__button"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="admin-modal-overlay" onClick={closeCustomerDetails}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="admin-modal__header">
              <h3>Customer Details</h3>
              <button
                type="button"
                className="admin-button admin-button--icon"
                onClick={closeCustomerDetails}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              {loadingDetails ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
              ) : customerDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>Name</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{customerDetails.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>Email</label>
                    <div>{customerDetails.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>User Type</label>
                    <div>
                      <span className="admin-badge admin-badge--default">
                        {customerDetails.user_type || 'customer'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>Joined Date</label>
                    <div>{formatDate(customerDetails.createdAt)}</div>
                  </div>
                  {customerDetails.phone && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>Phone</label>
                      <div>{customerDetails.phone}</div>
                    </div>
                  )}
                  {customerDetails.address && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>Address</label>
                      <div>
                        {customerDetails.address.postalCode && <span>{customerDetails.address.postalCode} </span>}
                        {customerDetails.address.address1}
                        {customerDetails.address.address2 && ` ${customerDetails.address.address2}`}
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#6b7280' }}>User ID</label>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#6b7280' }}>{customerDetails._id}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                  고객 정보를 불러올 수 없습니다.
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={closeCustomerDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

