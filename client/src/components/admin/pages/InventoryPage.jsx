import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, Grid, Search, Filter, Download, MoreVertical } from 'lucide-react';
import { fetchProducts } from '../../../services/productService';
import './InventoryPage.css';

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    topCategory: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, [statusFilter, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts({ limit: 100 });
      let filtered = data.products || [];

      if (statusFilter !== 'All Products') {
        filtered = filtered.filter(p => {
          const stock = p.inventory?.stock || 0;
          const minStock = p.inventory?.reorderPoint || 0;
          if (statusFilter === 'In Stock') return stock > minStock;
          if (statusFilter === 'Low Stock') return stock > 0 && stock <= minStock;
          if (statusFilter === 'Out Of Stock') return stock === 0;
          return true;
        });
      }

      if (searchQuery) {
        filtered = filtered.filter(p =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setProducts(filtered);

      // Calculate stats
      const allProducts = data.products || [];
      const lowStockCount = allProducts.filter(p => {
        const stock = p.inventory?.stock || 0;
        const minStock = p.inventory?.reorderPoint || 0;
        return stock > 0 && stock <= minStock;
      }).length;
      const outOfStockCount = allProducts.filter(p => (p.inventory?.stock || 0) === 0).length;

      setStats({
        totalProducts: allProducts.length,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        topCategory: 231, // Mock data
      });
    } catch (error) {
      console.error('상품 로드 실패:', error);
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

  const getStockStatus = (product) => {
    const stock = product.inventory?.stock || 0;
    const minStock = product.inventory?.reorderPoint || 0;
    if (stock === 0) return { label: 'Out of Stock', class: 'error', progress: 0 };
    if (stock <= minStock) return { label: 'Low Stock', class: 'warning', progress: (stock / minStock) * 100 };
    return { label: 'In Stock', class: 'success', progress: Math.min(100, (stock / (minStock * 2)) * 100) };
  };

  return (
    <div className="admin-inventory-page">
      {/* Stats Cards */}
      <div className="admin-grid admin-grid--stats">
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts} change={54} />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} change={-10} />
        <StatCard icon={XCircle} label="Out Of Stock" value={stats.outOfStock} change={54} />
        <StatCard icon={Grid} label="Top Category" value={stats.topCategory} change={54} />
      </div>

      {/* Products List */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>Product Inventory</h3>
          <div className="admin-card__header-actions">
            <div className="admin-tabs">
              {['All Products', 'In Stock', 'Low Stock', 'Out Of Stock'].map((status) => (
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
                placeholder="Search products..."
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
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-page-loading">Loading...</div>
        ) : (
          <div className="admin-table admin-table--inventory">
            <div className="admin-table__header">
              <span>Product Name</span>
              <span>Category</span>
              <span>Stock Level</span>
              <span>Amount</span>
              <span>Supplier</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            <div className="admin-table__body">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <div key={product._id} className="admin-table__row">
                    <div className="admin-table__cell-product">
                      <div className="admin-table__product-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="admin-table__product-placeholder">📦</div>
                        )}
                      </div>
                      <div className="admin-table__product-name">{product.name}</div>
                    </div>
                    <div>{product.category || '-'}</div>
                    <div>
                      <div className="admin-table__stock-info">
                        {product.inventory?.stock || 0} units
                      </div>
                      <div className="admin-table__stock-min">Min: {product.inventory?.reorderPoint || 0}</div>
                      <div className="admin-table__stock-progress">
                        <div
                          className={`admin-table__stock-progress-bar admin-table__stock-progress-bar--${stockStatus.class}`}
                          style={{ width: `${stockStatus.progress}%` }}
                        />
                      </div>
                    </div>
                    <div>{formatCurrency(product.price || 0)}</div>
                    <div>{product.inventory?.supplier || '-'}</div>
                    <div>
                      <span className={`admin-badge admin-badge--${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    <div>
                      <button type="button" className="admin-button admin-button--icon">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
        <div className="admin-card__value">{value.toLocaleString()}</div>
        <div className={`admin-card__trend-badge ${change >= 0 ? 'is-positive' : 'is-negative'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;

