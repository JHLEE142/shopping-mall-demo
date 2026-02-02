import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, Grid, Search, Filter, Download, MoreVertical, Edit, Trash2, X, Plus } from 'lucide-react';
import { fetchProducts, updateProduct, deleteProduct } from '../../../services/productService';
import './InventoryPage.css';

function InventoryPage({ onAddProduct }) {
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
  const [searchInput, setSearchInput] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [statusFilter, searchQuery]);

  // 검색어 debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500); // 500ms 후 검색 실행

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // 검색어를 백엔드 API에 전달
      const data = await fetchProducts(1, 100, null, searchQuery || null);
      // API 응답 형식: { page, limit, totalItems, totalPages, items }
      let filtered = data.items || data.products || [];

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

      setProducts(filtered);

      // Calculate stats
      const allProducts = data.items || data.products || [];
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
      setProducts([]);
      setStats({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        topCategory: 0,
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

  const getStockStatus = (product) => {
    const stock = product.inventory?.stock || 0;
    const minStock = product.inventory?.reorderPoint || 0;
    if (stock === 0) return { label: 'Out of Stock', class: 'error', progress: 0 };
    if (stock <= minStock) return { label: 'Low Stock', class: 'warning', progress: (stock / minStock) * 100 };
    return { label: 'In Stock', class: 'success', progress: Math.min(100, (stock / (minStock * 2)) * 100) };
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct._id, {
        name: editingProduct.name,
        price: editingProduct.price,
        inventory: {
          stock: editingProduct.inventory?.stock || 0,
          reorderPoint: editingProduct.inventory?.reorderPoint || 0,
          supplier: editingProduct.inventory?.supplier || '',
        },
      });
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('상품 수정 실패:', error);
      alert('상품 수정에 실패했습니다: ' + error.message);
    }
  };

  const handleDelete = (product) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm._id);
      setDeleteConfirm(null);
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      alert('상품 삭제에 실패했습니다: ' + error.message);
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      const deletePromises = Array.from(selectedProducts).map(productId => 
        deleteProduct(productId).catch(err => {
          console.error(`상품 ${productId} 삭제 실패:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      setSelectedProducts(new Set());
      setBulkDeleteConfirm(false);
      loadProducts();
    } catch (error) {
      console.error('다수 상품 삭제 실패:', error);
      alert('일부 상품 삭제에 실패했습니다.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      // 모든 상품 ID 가져오기
      const allProducts = await fetchProducts(1, 10000);
      const allProductIds = (allProducts.items || allProducts.products || []).map(p => p._id);
      
      if (allProductIds.length === 0) {
        alert('삭제할 상품이 없습니다.');
        setDeleteAllConfirm(false);
        return;
      }

      // 모든 상품 삭제
      const deletePromises = allProductIds.map(productId => 
        deleteProduct(productId).catch(err => {
          console.error(`상품 ${productId} 삭제 실패:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      setSelectedProducts(new Set());
      setDeleteAllConfirm(false);
      loadProducts();
      alert('모든 상품이 삭제되었습니다.');
    } catch (error) {
      console.error('전체 상품 삭제 실패:', error);
      alert('전체 상품 삭제에 실패했습니다: ' + error.message);
    }
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="button" className="admin-button admin-button--icon">
              <Filter size={18} />
            </button>
            <button type="button" className="admin-button admin-button--icon">
              <MoreVertical size={18} />
            </button>
            {selectedProducts.size > 0 && (
              <button 
                type="button" 
                className="admin-button admin-button--danger"
                onClick={() => setBulkDeleteConfirm(true)}
                style={{ marginRight: '0.5rem' }}
              >
                <Trash2 size={18} />
                선택 삭제 ({selectedProducts.size})
              </button>
            )}
            <button 
              type="button" 
              className="admin-button admin-button--danger"
              onClick={() => setDeleteAllConfirm(true)}
              style={{ marginRight: '0.5rem' }}
            >
              <Trash2 size={18} />
              모두 삭제
            </button>
            {onAddProduct && (
              <button 
                type="button" 
                className="admin-button admin-button--primary"
                onClick={onAddProduct}
                style={{ marginRight: '0.5rem' }}
              >
                <Plus size={18} />
                상품 등록
              </button>
            )}
            <button type="button" className="admin-button admin-button--primary">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-page-loading">Loading...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>상품이 없습니다.</p>
          </div>
        ) : (
          <div className="admin-table admin-table--inventory">
            <div className="admin-table__header">
              <span>
                <input
                  type="checkbox"
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="admin-checkbox"
                />
              </span>
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
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="admin-checkbox"
                      />
                    </div>
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
                    <div className="admin-table__cell-actions">
                      <button 
                        type="button" 
                        className="admin-button admin-button--icon admin-button--edit"
                        onClick={() => handleEdit(product)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="admin-button admin-button--icon admin-button--delete"
                        onClick={() => handleDelete(product)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Edit Product</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setEditingProduct(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={editingProduct.name || ''} 
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Price</label>
                <input 
                  type="number" 
                  value={editingProduct.price || 0} 
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Stock</label>
                <input 
                  type="number" 
                  value={editingProduct.inventory?.stock || 0} 
                  onChange={(e) => setEditingProduct({ 
                    ...editingProduct, 
                    inventory: { 
                      ...editingProduct.inventory, 
                      stock: Number(e.target.value) 
                    } 
                  })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Reorder Point</label>
                <input 
                  type="number" 
                  value={editingProduct.inventory?.reorderPoint || 0} 
                  onChange={(e) => setEditingProduct({ 
                    ...editingProduct, 
                    inventory: { 
                      ...editingProduct.inventory, 
                      reorderPoint: Number(e.target.value) 
                    } 
                  })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>Supplier</label>
                <input 
                  type="text" 
                  value={editingProduct.inventory?.supplier || ''} 
                  onChange={(e) => setEditingProduct({ 
                    ...editingProduct, 
                    inventory: { 
                      ...editingProduct.inventory, 
                      supplier: e.target.value 
                    } 
                  })}
                  className="admin-input"
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button 
                type="button" 
                className="admin-button"
                onClick={() => setEditingProduct(null)}
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
              <h3>Delete Product</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <p>Are you sure you want to delete "{deleteConfirm.name}"?</p>
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
              <h3>Delete Multiple Products</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setBulkDeleteConfirm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <p>Are you sure you want to delete {selectedProducts.size} selected product(s)?</p>
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
                Delete {selectedProducts.size} Product(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteAllConfirm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Delete All Products</h3>
              <button 
                type="button" 
                className="admin-button admin-button--icon"
                onClick={() => setDeleteAllConfirm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ color: '#dc3545', fontWeight: 'bold', marginBottom: '1rem' }}>
                ⚠️ 경고: 모든 상품을 삭제하시겠습니까?
              </p>
              <p>이 작업은 되돌릴 수 없습니다. 모든 상품 데이터가 영구적으로 삭제됩니다.</p>
              <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                현재 등록된 모든 상품이 삭제됩니다.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button 
                type="button" 
                className="admin-button"
                onClick={() => setDeleteAllConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-button admin-button--danger"
                onClick={handleDeleteAll}
              >
                Delete All Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 빈 상태 스타일 추가
const emptyStateStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: '#6b7280',
};

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

