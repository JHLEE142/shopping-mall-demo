import React, { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, Search, Filter, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { fetchOrders as fetchOrdersApi, updateOrder as updateOrderApi, deleteOrder as deleteOrderApi } from '../../../services/orderService';
import './OrderPage.css';

const ORDER_STATUSES = ['All Order', 'Pending', 'Processing', 'Out for Delivery', 'Delivered'];
const PAGE_SIZES = [10, 30, 50, 100];

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
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, searchQuery, pageSize]);

  // 검색어 debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // 검색 시 첫 페이지로 리셋
    }, 500); // 500ms 후 검색 실행

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
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

  const handleEdit = (order) => {
    setEditingOrder(order);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    try {
      await updateOrderApi(editingOrder._id, {
        status: editingOrder.status,
        notes: editingOrder.notes,
      });
      setEditingOrder(null);
      loadOrders();
    } catch (error) {
      console.error('주문 수정 실패:', error);
      alert('주문 수정에 실패했습니다: ' + error.message);
    }
  };

  const handleDelete = (order) => {
    setDeleteConfirm(order);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOrderApi(deleteConfirm._id);
      setDeleteConfirm(null);
      setSelectedOrders(new Set());
      loadOrders();
    } catch (error) {
      console.error('주문 삭제 실패:', error);
      alert('주문 삭제에 실패했습니다: ' + error.message);
    }
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    
    try {
      const deletePromises = Array.from(selectedOrders).map(orderId => 
        deleteOrderApi(orderId).catch(err => {
          console.error(`주문 ${orderId} 삭제 실패:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      setSelectedOrders(new Set());
      setBulkDeleteConfirm(false);
      loadOrders();
    } catch (error) {
      console.error('다수 주문 삭제 실패:', error);
      alert('일부 주문 삭제에 실패했습니다.');
    }
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select 
              className="admin-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            {selectedOrders.size > 0 && (
              <button 
                type="button" 
                className="admin-button admin-button--danger"
                onClick={() => setBulkDeleteConfirm(true)}
              >
                <Trash2 size={18} />
                Delete Selected ({selectedOrders.size})
              </button>
            )}
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
                <span>
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="admin-checkbox"
                  />
                </span>
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
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="admin-checkbox"
                      />
                    </div>
                    <div className="admin-table__cell-product">
                      <div className="admin-table__product-image">
                        {order.items?.[0]?.product?.image || order.items?.[0]?.thumbnail ? (
                          <img src={order.items[0].product?.image || order.items[0].thumbnail} alt={order.items[0].product?.name || order.items[0].name} />
                        ) : (
                          <div className="admin-table__product-placeholder">📦</div>
                        )}
                      </div>
                      <div>
                        <div className="admin-table__product-name">
                          {order.items?.[0]?.product?.name || order.items?.[0]?.name || 'N/A'}
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
                      <div className="admin-table__order-id">
                        {order.orderNumber ? (order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`) : `#${order._id?.slice(-8)}`}
                      </div>
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
                    <div className="admin-table__cell-actions">
                      <button 
                        type="button" 
                        className="admin-button admin-button--icon admin-button--edit"
                        onClick={() => handleEdit(order)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="admin-button admin-button--icon admin-button--delete"
                        onClick={() => handleDelete(order)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
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

      {/* Edit Modal */}
      {editingOrder && (
        <div className="admin-modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Edit Order</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setEditingOrder(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label>Order Number</label>
                <input 
                  type="text" 
                  value={editingOrder.orderNumber || ''} 
                  disabled 
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select 
                  value={editingOrder.status || 'pending'} 
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="admin-input"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Notes</label>
                <textarea 
                  value={editingOrder.notes || ''} 
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  className="admin-input"
                  rows={4}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button 
                type="button" 
                className="admin-button"
                onClick={() => setEditingOrder(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-button admin-button--primary"
                onClick={handleSaveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Delete Order</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <p>Are you sure you want to delete order {deleteConfirm.orderNumber ? (deleteConfirm.orderNumber.startsWith('#') ? deleteConfirm.orderNumber : `#${deleteConfirm.orderNumber}`) : `#${deleteConfirm._id?.slice(-8)}`}?</p>
              <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button 
                type="button" 
                className="admin-button"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-button admin-button--danger"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Delete Multiple Orders</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setBulkDeleteConfirm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <p>Are you sure you want to delete {selectedOrders.size} selected order(s)?</p>
              <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button 
                type="button" 
                className="admin-button"
                onClick={() => setBulkDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-button admin-button--danger"
                onClick={handleBulkDelete}
              >
                Delete {selectedOrders.size} Order(s)
              </button>
            </div>
          </div>
        </div>
      )}
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

