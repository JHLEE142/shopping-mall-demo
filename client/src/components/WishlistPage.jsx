import { useEffect, useState } from 'react';
import { Heart, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchWishlist, removeWishlistItem, removeWishlistItems } from '../services/wishlistService';
import './WishlistPage.css';

function formatCurrency(value, currency = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function WishlistPage({ user, onBack, onViewProduct }) {
  const [wishlist, setWishlist] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [removingItemIds, setRemovingItemIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setStatus('loading');
      setError('');
      const data = await fetchWishlist();
      setWishlist(data.wishlist);
      setStatus('success');
    } catch (err) {
      setError(err.message || '찜하기 목록을 불러오지 못했습니다.');
      setStatus('error');
    }
  };

  const handleToggleSelect = (productId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!wishlist?.items) return;
    const currentPageItems = getCurrentPageItems();
    const allSelected = currentPageItems.every((item) =>
      selectedItems.has(item.product._id)
    );
    
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        currentPageItems.forEach((item) => next.delete(item.product._id));
      } else {
        currentPageItems.forEach((item) => next.add(item.product._id));
      }
      return next;
    });
  };

  const handleRemoveItem = async (productId) => {
    try {
      setRemovingItemIds((prev) => new Set(prev).add(productId));
      await removeWishlistItem(productId);
      await loadWishlist();
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch (err) {
      alert(err.message || '찜하기에서 제거하지 못했습니다.');
    } finally {
      setRemovingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedItems.size}개의 상품을 찜하기에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const productIds = Array.from(selectedItems);
      setRemovingItemIds(new Set(productIds));
      await removeWishlistItems(productIds);
      await loadWishlist();
      setSelectedItems(new Set());
    } catch (err) {
      alert(err.message || '찜하기에서 제거하지 못했습니다.');
    } finally {
      setRemovingItemIds(new Set());
    }
  };

  const getCurrentPageItems = () => {
    if (!wishlist?.items) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return wishlist.items.slice(start, end);
  };

  const totalPages = wishlist?.items
    ? Math.ceil(wishlist.items.length / itemsPerPage)
    : 1;

  const currentPageItems = getCurrentPageItems();
  const allSelectedOnPage =
    currentPageItems.length > 0 &&
    currentPageItems.every((item) => selectedItems.has(item.product._id));

  if (status === 'loading') {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page__header">
          <h1>찜리스트</h1>
        </div>
        <div className="wishlist-page__loading">
          <p>찜하기 목록을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page__header">
          <button type="button" className="wishlist-page__back" onClick={onBack}>
            ← 계속 쇼핑하기
          </button>
          <h1>찜한 상품</h1>
        </div>
        <div className="wishlist-page__error">
          <p>{error}</p>
          <button type="button" onClick={loadWishlist}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const hasItems = wishlist?.items && wishlist.items.length > 0;

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__header">
        <button type="button" className="wishlist-page__back" onClick={onBack}>
          ← 계속 쇼핑하기
        </button>
        <div>
          <h1>찜한 상품</h1>
          <p className="wishlist-page__count">총 {wishlist?.items?.length || 0}건</p>
        </div>
      </div>

      {!hasItems ? (
        <div className="wishlist-page__empty">
          <Heart size={64} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>찜하기 목록이 비어 있습니다.</p>
          <button type="button" className="wishlist-page__continue" onClick={onBack}>
            상품 보러가기
          </button>
        </div>
      ) : (
        <>
          <div className="wishlist-table-wrapper">
            <table className="wishlist-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={handleSelectAll}
                      aria-label="전체 선택"
                    />
                  </th>
                  <th>상품명</th>
                  <th>상품금액</th>
                  <th>할인/적립</th>
                  <th>합계금액</th>
                </tr>
              </thead>
              <tbody>
                {currentPageItems.map((item) => {
                  const product = item.product;
                  const productId = product._id || product.id;
                  const isSelected = selectedItems.has(productId);
                  const isRemoving = removingItemIds.has(productId);
                  const productPrice = product.price || 0;
                  // 할인 정보는 현재는 없으므로 기본값 표시
                  const discount = 0;
                  const points = 0;
                  const finalPrice = productPrice - discount;

                  return (
                    <tr key={productId} className={isRemoving ? 'wishlist-table__row--removing' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(productId)}
                          disabled={isRemoving}
                        />
                      </td>
                      <td>
                        <div className="wishlist-table__product">
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="wishlist-table__product-image"
                            onError={(e) => {
                              e.target.src = '/placeholder.png';
                            }}
                            onClick={() => onViewProduct && onViewProduct({ id: productId, ...product })}
                            style={{ cursor: 'pointer' }}
                          />
                          <span
                            className="wishlist-table__product-name"
                            onClick={() => onViewProduct && onViewProduct({ id: productId, ...product })}
                            style={{ cursor: 'pointer' }}
                          >
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="wishlist-table__price">
                          {formatCurrency(productPrice)}
                        </span>
                      </td>
                      <td>
                        <div className="wishlist-table__discount-info">
                          <div className="wishlist-table__discount-row">
                            <span className="wishlist-table__discount-icon" style={{ color: '#ef4444' }}>
                              -
                            </span>
                            <span>할인 : {discount > 0 ? `- ${formatCurrency(discount)}` : '-'}</span>
                          </div>
                          <div className="wishlist-table__discount-row">
                            <span className="wishlist-table__discount-icon" style={{ color: '#3b82f6' }}>
                              M
                            </span>
                            <span>적립 : {points > 0 ? `${formatCurrency(points)}` : '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="wishlist-table__total">
                          {discount > 0 ? (
                            <>
                              <span className="wishlist-table__total-price">
                                {formatCurrency(finalPrice)}
                              </span>
                              <span className="wishlist-table__total-original">
                                {formatCurrency(productPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="wishlist-table__total-price">
                              {formatCurrency(productPrice)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="wishlist-page__actions">
            <button
              type="button"
              className="wishlist-page__delete-button"
              onClick={handleRemoveSelected}
              disabled={selectedItems.size === 0}
            >
              선택 상품 삭제
            </button>
          </div>

          {totalPages > 1 && (
            <div className="wishlist-page__pagination">
              <button
                type="button"
                className="wishlist-page__pagination-button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="첫 페이지"
              >
                &lt;&lt;
              </button>
              <button
                type="button"
                className="wishlist-page__pagination-button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="이전 페이지"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`wishlist-page__pagination-page ${
                      currentPage === pageNum ? 'wishlist-page__pagination-page--active' : ''
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                className="wishlist-page__pagination-button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="다음 페이지"
              >
                &gt;
              </button>
              <button
                type="button"
                className="wishlist-page__pagination-button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="마지막 페이지"
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WishlistPage;

