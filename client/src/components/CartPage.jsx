import { useEffect, useMemo, useState } from 'react';
import { Heart, Minus, Plus, Trash2 } from 'lucide-react';
import { fetchCart, removeCartItem, updateCartItemQuantity } from '../services/cartService';
import { addWishlistItem } from '../services/wishlistService';

const RECOMMENDED_PRODUCTS = [
  {
    id: 'rec-1',
    title: 'Urban Pleats Skirt',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=560&q=80',
    tag: '신상',
  },
  {
    id: 'rec-2',
    title: 'Soft Draped Jacket',
    price: 129000,
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=560&q=80',
    tag: '베스트',
  },
  {
    id: 'rec-3',
    title: 'Minimal Knit Top',
    price: 69000,
    image: 'https://images.unsplash.com/photo-1530023367847-a683933f4175?auto=format&fit=crop&w=560&q=80',
    tag: '코로라 추천',
  },
  {
    id: 'rec-4',
    title: 'Contour Wide Pants',
    price: 99000,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=560&q=80',
    tag: '한정수량',
  },
];

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

function CartPage({ onCartChange = () => {}, onProceedToCheckout = () => {}, onMoveToWishlist = () => {} }) {
  const [cart, setCart] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [addingToWishlist, setAddingToWishlist] = useState(null);

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

  const hasItems = cart?.items?.length;
  const subtotal = useMemo(() => {
    if (!cart?.summary) return 0;
    return cart.summary.subtotal || 0;
  }, [cart]);

  const shippingFee = subtotal >= 100000 ? 0 : 3000;
  const total = subtotal + shippingFee;
  const currencyCode = cart?.summary?.currency || 'KRW';

  const handleQuantityChange = async (productId, delta) => {
    if (!cart) return;
    const currentItem = cart.items.find((item) => item.product._id === productId);
    if (!currentItem) return;

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
                {cart.items.map((item) => {
                  const isUpdating = updatingItemId === item.product._id;
                  const isRemoving = removingItemId === item.product._id;
                  const productPrice = item.priceSnapshot;
                  const hasDiscount =
                    item.product?.price && item.product.price > productPrice ? item.product.price : null;

                  return (
                    <li key={item.product._id} className="cart-item-card">
                      <div className="cart-item-card__media">
                        <img src={item.product.image} alt={item.product.name} />
                      </div>
                      <div className="cart-item-card__content">
                        <div className="cart-item-card__header">
                          <div>
                            <h2>{item.product.name}</h2>
                            <span className="cart-item-card__sku">SKU: {item.product.sku}</span>
                          </div>
                          <button
                            type="button"
                            className="cart-item-card__remove"
                            onClick={() => handleRemoveItem(item.product._id)}
                            disabled={isRemoving || isUpdating}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

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
                              onClick={() => handleQuantityChange(item.product._id, -1)}
                              disabled={isUpdating || item.quantity <= 1}
                              aria-label="수량 감소"
                            >
                              <Minus size={16} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.product._id, 1)}
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
                            onClick={() => handleSaveForLater(item.product._id)}
                            disabled={addingToWishlist === item.product._id || isUpdating || isRemoving}
                          >
                            <Heart size={16} />
                            찜하기
                          </button>
                          <button
                            type="button"
                            className="cart-item-card__action-remove"
                            onClick={() => handleRemoveItem(item.product._id)}
                            disabled={isRemoving || isUpdating}
                          >
                            삭제하기
                          </button>
                        </div>
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
            <h2>You might also like</h2>
            <div className="cart-recommend__grid">
              {RECOMMENDED_PRODUCTS.map((product) => (
                <article key={product.id} className="cart-recommend__card">
                  <div className="cart-recommend__image">
                    <img src={product.image} alt={product.title} loading="lazy" />
                    <span className="cart-recommend__tag">{product.tag}</span>
                  </div>
                  <div className="cart-recommend__info">
                    <h3>{product.title}</h3>
                    <p>{formatCurrency(product.price, currencyCode)}</p>
                    <button type="button">View Details</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default CartPage;

