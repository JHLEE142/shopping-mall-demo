import { useEffect, useState, useMemo } from 'react';
import { Heart, Trash2, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { fetchWishlist, removeWishlistItem, removeWishlistItems } from '../services/wishlistService';
import { addItemToCart } from '../services/cartService';
import { getPoints } from '../services/pointService';
import './WishlistPage.css';

function formatCurrency(value, currency = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function WishlistPage({ user, onBack, onViewProduct, onMoveToOrder, pointsBalance = 0 }) {
  const [wishlist, setWishlist] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [removingItemIds, setRemovingItemIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [availablePoints, setAvailablePoints] = useState(pointsBalance);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadWishlist();
    if (user) {
      loadPoints();
    }
  }, [user]);

  const loadPoints = async () => {
    try {
      const data = await getPoints();
      setAvailablePoints(data.availablePoints || 0);
    } catch (err) {
      console.error('적립금 로드 실패:', err);
      setAvailablePoints(0);
    }
  };

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

  // 선택한 상품들 가져오기
  const selectedProducts = useMemo(() => {
    if (!wishlist?.items) return [];
    return wishlist.items.filter((item) => 
      selectedItems.has(item.product._id || item.product.id)
    );
  }, [wishlist, selectedItems]);

  // 선택한 상품들의 합계 금액 계산
  const subtotal = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const product = item.product;
      const price = product.price || product.priceSale || 0;
      return sum + price;
    }, 0);
  }, [selectedProducts]);

  // 배송비 계산 (2만원 이상 시 무료)
  const shippingFee = useMemo(() => {
    return subtotal >= 20000 ? 0 : 3000;
  }, [subtotal]);

  // 적립금 사용 금액 (최대 사용 가능 적립금까지)
  const pointsDiscount = useMemo(() => {
    if (!usePoints || pointsToUse <= 0) return 0;
    return Math.min(pointsToUse, availablePoints, subtotal);
  }, [usePoints, pointsToUse, availablePoints, subtotal]);

  // 총 결제금액
  const total = useMemo(() => {
    return Math.max(0, subtotal - pointsDiscount + shippingFee);
  }, [subtotal, pointsDiscount, shippingFee]);

  // 바로 구매 처리
  const handleDirectPurchase = async () => {
    if (selectedProducts.length === 0) {
      alert('구매할 상품을 선택해주세요.');
      return;
    }

    if (usePoints && pointsToUse > availablePoints) {
      alert('사용 가능한 적립금을 초과했습니다.');
      return;
    }

    if (usePoints && pointsToUse > subtotal) {
      alert('적립금은 상품 금액을 초과할 수 없습니다.');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // 선택한 상품들을 장바구니에 추가
      for (const item of selectedProducts) {
        const productId = item.product._id || item.product.id;
        await addItemToCart(productId, 1, {});
      }

      // OrderPage로 이동
      if (onMoveToOrder) {
        onMoveToOrder();
      }
    } catch (err) {
      console.error('장바구니 추가 실패:', err);
      alert(err.message || '장바구니에 상품을 추가하지 못했습니다.');
    } finally {
      setIsAddingToCart(false);
    }
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

          {/* 선택 상품 구매 섹션 */}
          {selectedProducts.length > 0 && (
            <div className="wishlist-purchase-summary" style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
                선택 상품 구매
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>상품 합계</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                
                {user && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => {
                          setUsePoints(e.target.checked);
                          if (!e.target.checked) {
                            setPointsToUse(0);
                          } else {
                            setPointsToUse(Math.min(availablePoints, subtotal));
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>적립금 사용</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        (사용 가능: {formatCurrency(availablePoints)})
                      </span>
                    </label>
                    
                    {usePoints && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <input
                          type="number"
                          min="0"
                          max={Math.min(availablePoints, subtotal)}
                          value={pointsToUse}
                          onChange={(e) => {
                            const value = Math.max(0, Math.min(Number(e.target.value), availablePoints, subtotal));
                            setPointsToUse(value);
                          }}
                          placeholder="사용할 적립금 입력"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        />
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setPointsToUse(Math.min(availablePoints, subtotal))}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            전액 사용
                          </button>
                          <button
                            type="button"
                            onClick={() => setPointsToUse(0)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            초기화
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {usePoints && pointsDiscount > 0 && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#eff6ff', borderRadius: '4px', fontSize: '0.875rem', color: '#1e40af' }}>
                        적립금 할인: -{formatCurrency(pointsDiscount)}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  <span>배송비</span>
                  <span>{shippingFee === 0 ? '무료' : formatCurrency(shippingFee)}</span>
                </div>
                {subtotal > 0 && subtotal < 20000 && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {formatCurrency(20000 - subtotal)} 추가 구매 시 무료배송
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '1rem', 
                  paddingTop: '1rem',
                  borderTop: '2px solid #e5e7eb',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                }}>
                  <span>총 결제금액</span>
                  <strong style={{ color: '#ef4444', fontSize: '1.25rem' }}>
                    {formatCurrency(total)}
                  </strong>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleDirectPurchase}
                disabled={isAddingToCart || selectedProducts.length === 0}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: isAddingToCart ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isAddingToCart ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShoppingBag size={20} />
                {isAddingToCart ? '장바구니에 추가 중...' : '선택 상품 바로 구매'}
              </button>
            </div>
          )}

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

