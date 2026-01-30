import { useEffect, useMemo, useState } from 'react';
import { Heart, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { fetchCart, removeCartItem, updateCartItemQuantity, addItemToCart } from '../services/cartService';
import { addWishlistItem } from '../services/wishlistService';
import { fetchProducts } from '../services/productService';

function normalizeSelectedOptions(options) {
  if (!options) return {};
  if (options instanceof Map) {
    return Object.fromEntries(options.entries());
  }
  if (typeof options === 'object') {
    return options;
  }
  return {};
}

function formatCurrency(value, currency = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function CartPage({
  onCartChange = () => {},
  onProceedToCheckout = () => {},
  onMoveToWishlist = () => {},
  onViewProduct = () => {},
}) {
  const [cart, setCart] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [addingToWishlist, setAddingToWishlist] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setStatus('loading');
        const data = await fetchCart();
        if (!isMounted) return;
        setCart(data.cart);
        setStatus('success');
        onCartChange(data.cart?.items?.length ?? 0);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
        setStatus('error');
        onCartChange(0);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [onCartChange]);

  // 추천 상품 로드
  useEffect(() => {
    async function loadRecommendedProducts() {
      try {
        setRecommendedLoading(true);
        // 장바구니에 있는 상품들의 카테고리를 기반으로 추천 상품 가져오기
        if (cart?.items?.length > 0) {
          // 첫 번째 상품의 카테고리를 기준으로 추천
          const firstProduct = cart.items[0].product;
          const category = firstProduct?.categoryMain || firstProduct?.category || null;
          
          // 추천 상품 가져오기 (최대 4개)
          const data = await fetchProducts(1, 4, category, null);
          const products = data?.items || [];
          
          // 장바구니에 이미 있는 상품 제외
          const cartProductIds = new Set(
            cart.items.map(item => {
              const productId = item.product?._id || item.product;
              return productId?.toString();
            }).filter(Boolean)
          );
          
          const filteredProducts = products.filter(product => {
            const productId = product._id?.toString() || product.id?.toString();
            return !cartProductIds.has(productId);
          });
          
          setRecommendedProducts(filteredProducts.slice(0, 4));
        } else {
          // 장바구니가 비어있으면 인기 상품 가져오기
          const data = await fetchProducts(1, 4, null, null);
          setRecommendedProducts(data?.items || []);
        }
      } catch (err) {
        console.error('추천 상품 로드 실패:', err);
        setRecommendedProducts([]);
      } finally {
        setRecommendedLoading(false);
      }
    }

    if (status === 'success') {
      loadRecommendedProducts();
    }
  }, [cart, status]);

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(productId);
      await addItemToCart(productId, 1, {});
      setNotice({ type: 'success', message: '장바구니에 추가되었습니다.' });
      // 장바구니 새로고침
      const data = await fetchCart();
      setCart(data.cart);
      onCartChange(data.cart?.items?.length ?? 0);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || '장바구니에 추가하지 못했습니다.' });
    } finally {
      setAddingToCart(null);
    }
  };

  const hasItems = cart?.items?.length;
  const subtotal = useMemo(() => {
    if (!cart?.summary) return 0;
    return cart.summary.subtotal || 0;
  }, [cart]);

  const shippingFee = subtotal >= 20000 ? 0 : 3000;
  const total = subtotal + shippingFee;
  const currencyCode = cart?.summary?.currency || 'KRW';

  const handleQuantityChange = async (productId, delta) => {
    if (!cart) return;
    const currentItem = cart.items.find((item) => {
      const itemProductId = item.product?._id || item.product;
      return itemProductId === productId || itemProductId?.toString() === productId?.toString();
    });
    if (!currentItem) return;
    
    // 삭제된 상품은 수량 변경 불가
    if (!currentItem.product || currentItem.product === null) {
      setNotice({ type: 'error', message: '삭제된 상품의 수량을 변경할 수 없습니다.' });
      return;
    }

    const nextQuantity = currentItem.quantity + delta;
    if (nextQuantity < 1) {
      setNotice({ type: 'error', message: '수량은 최소 1개 이상이어야 합니다.' });
      return;
    }

    setUpdatingItemId(productId);
    setNotice({ type: '', message: '' });

    try {
      const { cart: updatedCart } = await updateCartItemQuantity(
        productId,
        nextQuantity,
        normalizeSelectedOptions(currentItem.selectedOptions)
      );
      setCart(updatedCart);
      onCartChange(updatedCart?.items?.length ?? 0);
      setNotice({ type: 'success', message: '수량이 변경되었습니다.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || '수량을 변경하지 못했습니다.' });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    setRemovingItemId(productId);
    setNotice({ type: '', message: '' });

    try {
      const { cart: updatedCart } = await removeCartItem(productId);
      setCart(updatedCart);
      onCartChange(updatedCart?.items?.length ?? 0);
      setNotice({ type: 'success', message: '상품이 장바구니에서 삭제되었습니다.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || '상품을 삭제하지 못했습니다.' });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleSaveForLater = async (productId) => {
    if (!cart) return;
    const currentItem = cart.items.find((item) => {
      const itemProductId = item.product?._id || item.product;
      return itemProductId === productId || itemProductId?.toString() === productId?.toString();
    });
    
    // 삭제된 상품은 찜하기 불가
    if (!currentItem || !currentItem.product || currentItem.product === null) {
      setNotice({ type: 'error', message: '삭제된 상품은 찜하기에 추가할 수 없습니다.' });
      return;
    }
    
    try {
      setAddingToWishlist(productId);
      setNotice({ type: '', message: '' });
      await addWishlistItem(productId);
      setNotice({ type: 'success', message: '찜하기에 추가되었습니다.' });
      // 찜하기 페이지로 이동
      setTimeout(() => {
        onMoveToWishlist();
      }, 1000);
    } catch (err) {
      if (err.message.includes('이미 찜하기에 추가된')) {
        setNotice({ type: 'info', message: '이미 찜하기에 추가된 상품입니다.' });
        setTimeout(() => {
          onMoveToWishlist();
        }, 1000);
      } else {
        setNotice({ type: 'error', message: err.message || '찜하기에 추가하지 못했습니다.' });
      }
    } finally {
      setAddingToWishlist(null);
    }
  };

  const renderOption = (item, key) => {
    const options = normalizeSelectedOptions(item.selectedOptions);
    return options?.[key] || options?.[key.toLowerCase()] || '-';
  };

  return (
    <div className="cart-page">
      <header className="cart-page__header">
        <div>
          <button type="button" className="cart-page__back" onClick={() => window.history.back()}>
            ← 계속 쇼핑하기
          </button>
          <h1>Shopping Bag ({cart?.items?.length ?? 0})</h1>
        </div>
      </header>

      {notice.message && (
        <div className={`cart-page__notice cart-page__notice--${notice.type || 'info'}`}>{notice.message}</div>
      )}

      {status === 'loading' && <p className="cart-page__status">장바구니를 불러오는 중입니다...</p>}
      {status === 'error' && <p className="cart-page__status cart-page__status--error">{error}</p>}

      {status === 'success' && !hasItems && (
        <div className="cart-page__empty">
          <p>장바구니가 비어 있습니다.</p>
          <button type="button" className="cart-page__continue" onClick={() => window.history.back()}>
            상품 보러가기
          </button>
        </div>
      )}

      {status === 'success' && hasItems && (
        <>
          <div className="cart-page__body">
            <section className="cart-page__items">
              <ul className="cart-item-list">
                {cart.items.map((item, index) => {
                  const productId = item.product?._id || item.product || `deleted-${index}`;
                  const isProductDeleted = !item.product || item.product === null;
                  const isUpdating = updatingItemId === productId;
                  const isRemoving = removingItemId === productId;
                  const productPrice = item.priceSnapshot;
                  const hasDiscount =
                    item.product?.price && item.product.price > productPrice ? item.product.price : null;

                  return (
                    <li key={productId} className="cart-item-card">
                      <div className="cart-item-card__media">
                        {isProductDeleted ? (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            background: '#f3f4f6', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            이미지 없음
                          </div>
                        ) : (
                          <img src={item.product.image || '/placeholder.png'} alt={item.product.name || '상품'} />
                        )}
                      </div>
                      <div className="cart-item-card__content">
                        <div className="cart-item-card__header">
                          <div>
                            <h2 style={{ 
                              color: isProductDeleted ? '#9ca3af' : 'inherit',
                              textDecoration: isProductDeleted ? 'line-through' : 'none'
                            }}>
                              {isProductDeleted ? '삭제된 상품' : item.product.name}
                            </h2>
                            {!isProductDeleted && (
                              <span className="cart-item-card__sku">SKU: {item.product.sku || 'N/A'}</span>
                            )}
                            {isProductDeleted && (
                              <span className="cart-item-card__sku" style={{ color: '#dc3545' }}>
                                이 상품은 더 이상 판매되지 않습니다
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="cart-item-card__remove"
                            onClick={() => handleRemoveItem(productId)}
                            disabled={isRemoving || isUpdating}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {!isProductDeleted && (
                          <>
                            <div className="cart-item-card__meta">
                              <span>사이즈: {renderOption(item, 'size')}</span>
                              <span>컬러: {renderOption(item, 'color')}</span>
                              <span className="cart-item-card__stock">
                                <span className="cart-item-card__stock-indicator" /> 재고 있음
                              </span>
                            </div>

                            <div className="cart-item-card__footer">
                              <div className="cart-item-card__quantity">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(productId, -1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  aria-label="수량 감소"
                                >
                                  <Minus size={16} />
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(productId, 1)}
                                  disabled={isUpdating}
                                  aria-label="수량 증가"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>

                              <div className="cart-item-card__price">
                                <strong>{formatCurrency(productPrice * item.quantity, currencyCode)}</strong>
                                {hasDiscount && (
                                  <span className="cart-item-card__price-original">
                                    {formatCurrency(hasDiscount * item.quantity, currencyCode)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="cart-item-card__actions">
                              <button
                                type="button"
                                onClick={() => handleSaveForLater(productId)}
                                disabled={addingToWishlist === productId || isUpdating || isRemoving}
                              >
                                <Heart size={16} />
                                찜하기
                              </button>
                              <button
                                type="button"
                                className="cart-item-card__action-remove"
                                onClick={() => handleRemoveItem(productId)}
                                disabled={isRemoving || isUpdating}
                              >
                                삭제하기
                              </button>
                            </div>
                          </>
                        )}
                        {isProductDeleted && (
                          <div className="cart-item-card__footer">
                            <div className="cart-item-card__price">
                              <strong style={{ color: '#9ca3af' }}>
                                {formatCurrency(productPrice * item.quantity, currencyCode)}
                              </strong>
                            </div>
                            <div className="cart-item-card__actions">
                              <button
                                type="button"
                                className="cart-item-card__action-remove"
                                onClick={() => handleRemoveItem(productId)}
                                disabled={isRemoving || isUpdating}
                              >
                                삭제하기
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside className="cart-summary">
              <div className="cart-summary__card">
                <h3>Order Summary</h3>
                <dl>
                  <div>
                    <dt>Subtotal ({cart.items.length} items)</dt>
                    <dd>{formatCurrency(subtotal, currencyCode)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd>{shippingFee === 0 ? '무료' : formatCurrency(shippingFee, currencyCode)}</dd>
                  </div>
                  <div>
                    <dt>멤버 혜택</dt>
                    <dd>코로라 멤버는 무료 반품</dd>
                  </div>
                </dl>
                <div className="cart-summary__total">
                  <span>Total</span>
                  <strong>{formatCurrency(total, currencyCode)}</strong>
                </div>
                <button type="button" className="cart-summary__checkout" onClick={onProceedToCheckout}>
                  PROCEED TO CHECKOUT
                </button>
                <button type="button" className="cart-summary__continue" onClick={() => window.history.back()}>
                  CONTINUE SHOPPING
                </button>
                <div className="cart-summary__secure">
                  <span>We accept:</span>
                  <div className="cart-summary__payments">
                    <span>VISA</span>
                    <span>MC</span>
                    <span>AMEX</span>
                    <span>PAYPAL</span>
                  </div>
                  <p>✔ Secure checkout with SSL encryption</p>
                </div>
              </div>
            </aside>
          </div>

          <section className="cart-recommend">
            <h2>이런 상품은 어떠세요?</h2>
            {recommendedLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>추천 상품을 불러오는 중...</p>
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="cart-recommend__grid">
                {recommendedProducts.map((product) => {
                  const productId = product._id || product.id;
                  const productName = product.name || '상품명 없음';
                  const productPrice = product.price || product.priceSale || 0;
                  const productImage = product.image || '/placeholder.png';
                  const isAdding = addingToCart === productId?.toString();

                  return (
                    <article key={productId} className="cart-recommend__card">
                      <div className="cart-recommend__image">
                        <img 
                          src={productImage} 
                          alt={productName} 
                          loading="lazy"
                          onClick={() => onViewProduct && onViewProduct({ id: productId, ...product })}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="cart-recommend__info">
                        <h3 
                          onClick={() => onViewProduct && onViewProduct({ id: productId, ...product })}
                          style={{ cursor: 'pointer' }}
                        >
                          {productName}
                        </h3>
                        <p>{formatCurrency(productPrice, currencyCode)}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(productId)}
                            disabled={isAdding}
                            title={isAdding ? '추가 중...' : '장바구니에 담기'}
                            style={{
                              padding: '0.5rem',
                              background: isAdding ? '#9ca3af' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isAdding ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '2.5rem',
                              height: '2.5rem',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isAdding) {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isAdding) {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            {isAdding ? (
                              <span style={{ fontSize: '0.75rem' }}>...</span>
                            ) : (
                              <ShoppingBag size={18} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewProduct && onViewProduct({ id: productId, ...product })}
                            style={{
                              flex: 1,
                              padding: '0.5rem 1rem',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>추천 상품이 없습니다.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default CartPage;

