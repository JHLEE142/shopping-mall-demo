import React, { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, Search, Filter, MoreVertical } from 'lucide-react';
import { fetchOrders as fetchOrdersApi, updateOrder as updateOrderApi } from '../../../services/orderService';
import './OrderPage.css';

const ORDER_STATUSES = ['All Order', 'Pending', 'Processing', 'Out for Delivery', 'Delivered'];

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalNew: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalCanceled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Order');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter !== 'All Order') {
        params.status = statusFilter.toLowerCase();
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await fetchOrdersApi(params);
      // API 응답 형식: { page, limit, totalItems, totalPages, items }
      setOrders(data.items || data.orders || []);
      setPagination({
        totalPages: data.totalPages || data.pagination?.totalPages || 1,
        totalItems: data.totalItems || data.pagination?.totalItems || 0,
      });

      // Calculate stats
      const allOrders = await fetchOrdersApi({ limit: 1000 });
      const allOrdersList = allOrders.items || allOrders.orders || [];
      setStats({
        totalNew: allOrdersList.length,
        totalPending: allOrdersList.filter(o => o.status === 'pending').length,
        totalCompleted: allOrdersList.filter(o => o.status === 'completed' || o.status === 'delivered').length,
        totalCanceled: allOrdersList.filter(o => o.status === 'cancelled' || o.status === 'rejected').length,
      });
    } catch (error) {
      console.error('주문 로드 실패:', error);
      setOrders([]);
      setStats({
        totalNew: 0,
        totalPending: 0,
        totalCompleted: 0,
        totalCanceled: 0,
      });
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      accepted: 'success',
      completed: 'info',
      delivered: 'info',
      pending: 'warning',
      processing: 'warning',
      cancelled: 'error',
      rejected: 'error',
    };
    return statusMap[status?.toLowerCase()] || 'default';
  };

  const getCustomerSegment = (user) => {
    // 간단한 로직: 주문 수에 따라 분류
    return 'New Customer'; // 실제로는 주문 이력 기반으로 계산
  };

  return (
    <div className="admin-order-page">
      {/* Stats Cards */}
      <div className="admin-grid admin-grid--stats">
        <StatCard
          icon={ShoppingCart}
          label="Total New Orders"
          value={stats.totalNew}
          change={54}
          trend={true}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Total Orders Pending"
          value={stats.totalPending}
          change={-10}
          trend={false}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Orders Completed"
          value={stats.totalCompleted}
          change={54}
          trend={true}
          color="green"
        />
        <StatCard
          icon={XCircle}
          label="Total Orders Canceled"
          value={stats.totalCanceled}
          change={54}
          trend={true}
          color="red"
        />
      </div>

      {/* Orders List */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>Orders List</h3>
          <div className="admin-card__header-actions">
            <div className="admin-tabs">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`admin-tab ${statusFilter === status ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="admin-search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className="admin-button admin-button--icon">
              <Filter size={18} />
            </button>
            <button type="button" className="admin-button admin-button--icon">
              <MoreVertical size={18} />
            </button>
            <button type="button" className="admin-button admin-button--primary">
              <Plus size={18} />
              Add Order
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-page-loading">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>주문이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="admin-table admin-table--orders">
              <div className="admin-table__header">
                <span>Product Name</span>
                <span>Customer Name</span>
                <span>Order Id</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              <div className="admin-table__body">
                {orders.map((order) => (
                  <div key={order._id} className="admin-table__row">
                    <div className="admin-table__cell-product">
                      <div className="admin-table__product-image">
                        {order.items?.[0]?.product?.image ? (
                          <img src={order.items[0].product.image} alt={order.items[0].product.name} />
                        ) : (
                          <div className="admin-table__product-placeholder">📦</div>
                        )}
                      </div>
                      <div>
                        <div className="admin-table__product-name">
                          {order.items?.[0]?.product?.name || 'N/A'}
                        </div>
                        <div className="admin-table__product-meta">
                          Items {order.items?.length || 0}
                        </div>
                      </div>
                    </div>
                    <div className="admin-table__cell-customer">
                      <div className="admin-table__customer-avatar">
                        {order.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="admin-table__customer-name">{order.user?.name || 'Unknown'}</div>
                        <div className="admin-table__customer-segment">{getCustomerSegment(order.user)}</div>
                      </div>
                    </div>
                    <div>
                      <div className="admin-table__order-id">#{order.orderNumber || order._id?.slice(-8)}</div>
                      <div className="admin-table__order-date">{formatDate(order.createdAt)}</div>
                    </div>
                    <div>
                      <div className="admin-table__order-amount">{formatCurrency(order.summary?.grandTotal || order.payment?.amount || 0)}</div>
                      <div className="admin-table__order-payment">
                        {order.payment?.method === 'card' ? 'Paid by Mastercard' : 'Cash on Delivery'}
                      </div>
                    </div>
                    <div>
                      <span className={`admin-badge admin-badge--${getStatusBadgeClass(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <button type="button" className="admin-button admin-button--icon">
                        <MoreVertical size={18} />
                      </button>
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, trend, color }) {
  return (
    <div className="admin-card admin-card--stat">
      <div className={`admin-card__stat-icon admin-card__stat-icon--${color}`}>
        <Icon className="admin-icon" size={24} />
      </div>
      <div className="admin-card__stat-body">
        <div className="admin-card__label">{label}</div>
        <div className="admin-card__value">{value.toLocaleString()}</div>
        <div className={`admin-card__trend-badge ${trend ? 'is-positive' : 'is-negative'}`}>
          {trend ? '+' : ''}{change}%
        </div>
      </div>
    </div>
  );
}

export default OrderPage;

