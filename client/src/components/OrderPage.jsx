import { useEffect, useMemo, useState } from 'react';
import { fetchCart } from '../services/cartService';
import { createOrder as createOrderApi } from '../services/orderService';
import { getUserCoupons } from '../services/couponService';
import TossPaymentWidget from './TossPaymentWidget';

const PAYMENT_METHODS = [
  { value: 'online', label: 'Online Payment', description: '신용/체크카드, 간편결제' },
];

function formatCurrency(value, currency = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDisplayDate(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function OrderPage({
  user = null,
  onBackToCart = () => {},
  onOrderPlaced = () => {},
  onCartUpdate = () => {},
  directOrderItem = null, // 바로구매 아이템 { product, quantity, options }
}) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    city: '',
    state: '',
    postalCode: '',
    address1: '',
    address2: '',
    notes: '',
    paymentMethod: 'online',
    scheduleEnabled: true,
  });
  const [cart, setCart] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState('form'); // form | success | failure
  const [orderResult, setOrderResult] = useState(null);
  const [orderFailureMessage, setOrderFailureMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
    }));
  }, [user?.name, user?.email]);

  // 토스페이먼츠는 위젯 컴포넌트에서 초기화됨

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      try {
        setStatus('loading');
        
        // 바로구매 아이템이 있으면 가상의 cart 생성
        if (directOrderItem) {
          const virtualCart = {
            _id: 'direct-order',
            items: [{
              product: directOrderItem.product,
              quantity: directOrderItem.quantity,
              priceSnapshot: directOrderItem.product.priceSale || directOrderItem.product.price,
              options: directOrderItem.options || {},
            }],
          };
          if (!isMounted) return;
          setCart(virtualCart);
          setStatus('success');
          onCartUpdate(0); // 바로구매는 장바구니에 영향을 주지 않음
        } else {
          // 일반 주문: 장바구니에서 로드
          const data = await fetchCart();
          if (!isMounted) return;
          setCart(data.cart);
          setStatus('success');
          onCartUpdate(data.cart?.items?.length ?? 0);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || '주문 정보를 불러오지 못했습니다.');
        setStatus('error');
        onCartUpdate(0);
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [onCartUpdate, directOrderItem]);

  useEffect(() => {
    async function loadCoupons() {
      if (!user) return;
      
      try {
        setCouponsLoading(true);
        const data = await getUserCoupons();
        // 사용 가능한 쿠폰만 필터링 (미사용, 유효기간 내)
        const now = new Date();
        const validCoupons = (data.coupons || []).filter((uc) => {
          const coupon = uc.coupon || uc.couponId;
          if (!coupon || uc.isUsed) return false;
          if (!coupon.isActive) return false;
          const validFrom = new Date(coupon.validFrom);
          const validUntil = new Date(coupon.validUntil);
          return validFrom <= now && validUntil >= now;
        });
        setAvailableCoupons(validCoupons);
      } catch (err) {
        console.error('쿠폰 로드 실패:', err);
        setAvailableCoupons([]);
      } finally {
        setCouponsLoading(false);
      }
    }

    loadCoupons();
  }, [user]);

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) {
      return 0;
    }
    return cart.items.reduce((sum, item) => sum + item.quantity * item.priceSnapshot, 0);
  }, [cart]);

  // 쿠폰 할인 금액 계산
  const couponDiscount = useMemo(() => {
    if (!selectedCoupon || !cart?.items?.length) return 0;
    
    const coupon = selectedCoupon.coupon || selectedCoupon.couponId;
    if (!coupon) return 0;

    if (coupon.type === 'freeShipping') {
      return 0; // 무료배송은 shippingFee에서 처리
    } else if (coupon.type === 'fixedAmount') {
      return coupon.discountValue || 0;
    } else if (coupon.type === 'percentage') {
      const percentageDiscount = Math.floor(subtotal * ((coupon.discountValue || 0) / 100));
      if (coupon.maxDiscountAmount) {
        return Math.min(percentageDiscount, coupon.maxDiscountAmount);
      }
      return percentageDiscount;
    }
    return 0;
  }, [selectedCoupon, subtotal, cart]);

  const shippingFee = useMemo(() => {
    if (!cart?.items?.length) return 0;
    // 무료배송 쿠폰이 선택된 경우
    if (selectedCoupon) {
      const coupon = selectedCoupon.coupon || selectedCoupon.couponId;
      if (coupon && coupon.type === 'freeShipping') {
        return 0;
      }
    }
    return subtotal >= 20000 ? 0 : 3000;
  }, [cart, selectedCoupon, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - couponDiscount + shippingFee);
  }, [subtotal, couponDiscount, shippingFee]);

  const currencyCode = cart?.summary?.currency || 'KRW';

  const estimatedWindow = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const end = new Date();
    end.setDate(end.getDate() + 5);
    return `${formatDisplayDate(start)} ~ ${formatDisplayDate(end)}`;
  }, []);

  const convertSelectedOptions = (options) => {
    if (!options) return {};
    if (options instanceof Map) {
      return Object.fromEntries(options.entries());
    }
    if (typeof options === 'object') {
      return options;
    }
    return {};
  };

  const handleInputChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      scheduleEnabled: !prev.scheduleEnabled,
    }));
    setNotice({ type: '', message: '' });
  };

  const handleChangePaymentMethod = (value) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
    }));
  };

  const handlePaymentError = (error) => {
    console.error('결제 에러:', error);
    setIsSubmitting(false);
    setOrderStatus('failure');
    setOrderFailureMessage(error?.message || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    setNotice({
      type: 'error',
      message: error?.message || '결제 처리 중 오류가 발생했습니다.',
    });
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (orderStatus !== 'form') {
      return;
    }

    setIsSubmitting(true);
    setNotice({ type: 'info', message: '주문을 처리하는 중입니다...' });

    try {
      const orderData = {
        items: cart.items.map((item) => ({
          product: item.product._id || item.product.id,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot || (item.product.priceSale || item.product.price),
          options: convertSelectedOptions(item.options),
        })),
        shipping: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: {
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            address1: formData.address1,
            address2: formData.address2,
          },
          notes: formData.notes,
          scheduleEnabled: formData.scheduleEnabled,
        },
        payment: {
          method: formData.paymentMethod,
          transactionId: paymentData.paymentKey,
          amount: total,
        },
        coupon: selectedCoupon?._id || null,
      };

      const result = await createOrderApi(orderData);
      
      setOrderStatus('success');
      setOrderResult(result.order || result);
      setNotice({ type: 'success', message: '주문이 성공적으로 완료되었습니다.' });
      onCartUpdate(0);
    } catch (err) {
      console.error('주문 생성 실패:', err);
      setIsSubmitting(false);
      setOrderStatus('failure');
      setOrderFailureMessage(err.message || '주문 처리 중 오류가 발생했습니다.');
      setNotice({
        type: 'error',
        message: err.message || '주문 처리 중 오류가 발생했습니다.',
      });
    }
  };

  const renderOrderSummary = () => {
    if (!cart?.items?.length) {
      return (
        <div className="order-summary__empty">
          <p>주문할 상품이 없습니다.</p>
          <button type="button" onClick={onBackToCart}>
            장바구니로 돌아가기
          </button>
        </div>
      );
    }

    return (
      <>
        <ul className="order-summary__list">
          {cart.items.map((item, index) => (
            <li key={item.product._id || item.product.id || index} className="order-summary__item">
              <div className="order-summary__item-thumb">
                <img src={item.product.image || item.product.thumbnail || ''} alt={item.product.name} />
              </div>
              <div className="order-summary__item-info">
                <strong>{item.product.name}</strong>
                <span>{item.product.sku || ''}</span>
                <div>
                  수량 {item.quantity} ·{' '}
                  {formatCurrency((item.priceSnapshot || (item.product.priceSale || item.product.price)) * item.quantity, currencyCode)}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {user && (
          <div className="order-summary__coupon" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              쿠폰 선택
            </label>
            <select
              value={selectedCoupon?._id || ''}
              onChange={(e) => {
                const couponId = e.target.value;
                if (couponId) {
                  const coupon = availableCoupons.find(c => c._id === couponId);
                  setSelectedCoupon(coupon || null);
                } else {
                  setSelectedCoupon(null);
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
              }}
              disabled={couponsLoading}
            >
              <option value="">쿠폰을 선택하세요</option>
              {availableCoupons.map((uc) => {
                const coupon = uc.coupon || uc.couponId;
                if (!coupon) return null;
                const couponTitle = coupon.title || 
                  (coupon.type === 'freeShipping' ? '무료배송' :
                   coupon.type === 'fixedAmount' ? `${coupon.discountValue?.toLocaleString() || 0}원 할인` :
                   coupon.type === 'percentage' ? `${coupon.discountValue || 0}% 할인` : '쿠폰');
                return (
                  <option key={uc._id} value={uc._id}>
                    {couponTitle}
                  </option>
                );
              })}
            </select>
            {selectedCoupon && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6366f1' }}>
                {(() => {
                  const coupon = selectedCoupon.coupon || selectedCoupon.couponId;
                  if (coupon?.type === 'freeShipping') {
                    return '무료배송 쿠폰이 적용됩니다.';
                  } else if (coupon?.type === 'fixedAmount') {
                    return `${couponDiscount.toLocaleString()}원 할인됩니다.`;
                  } else if (coupon?.type === 'percentage') {
                    return `${couponDiscount.toLocaleString()}원 할인됩니다.`;
                  }
                  return '';
                })()}
              </div>
            )}
          </div>
        )}
        <dl className="order-summary__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal, currencyCode)}</dd>
          </div>
          {couponDiscount > 0 && (
            <div>
              <dt>Coupon Discount</dt>
              <dd style={{ color: '#6366f1' }}>-{formatCurrency(couponDiscount, currencyCode)}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>{shippingFee === 0 ? '무료' : formatCurrency(shippingFee, currencyCode)}</dd>
          </div>
          <div className="order-summary__grand">
            <dt>Total</dt>
            <dd>{formatCurrency(total, currencyCode)}</dd>
          </div>
        </dl>
        <div className="toss-payment-section">
          <TossPaymentWidget
            amount={total}
            orderName={cart.items.length === 1 ? cart.items[0].product.name : `주문 (${cart.items.length}건)`}
            customerName={formData.name}
            customerEmail={formData.email}
            customerPhone={formData.phone}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            disabled={isSubmitting || orderStatus !== 'form' || !formData.name || !formData.phone || !formData.address1}
          />
        </div>
      </>
    );
  };

  if (orderStatus === 'success' && orderResult) {
    const successCurrency = orderResult.summary?.currency || currencyCode || 'KRW';
    return (
      <div className="order-page order-page--result">
        <div className="order-result order-result--success">
          <div className="order-result__icon" aria-hidden="true">
            ✓
          </div>
          <h1 className="order-result__title">Thank you for your purchase!</h1>
          <p className="order-result__message">
            주문이 성공적으로 접수되었습니다. 평균 3~5일 이내에 배송이 시작되며, 주문 번호는{' '}
            <strong>#{orderResult.orderNumber}</strong> 입니다.
          </p>
          <div className="order-result__summary-card">
            <h2>Order Summary</h2>
            <ul className="order-result__items">
              {orderResult.items?.map((item) => (
                <li key={item.product?.toString() || item.name}>
                  <span>{item.name}</span>
                  <span>{formatCurrency(item.unitPrice * item.quantity, successCurrency)}</span>
                </li>
              ))}
            </ul>
            <div className="order-result__total">
              <span>Total</span>
              <strong>{formatCurrency(orderResult.summary?.grandTotal, successCurrency)}</strong>
            </div>
          </div>
          <div className="order-result__actions">
            <button
              type="button"
              onClick={() => onOrderPlaced(orderResult)}
              className="order-result__primary"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderStatus === 'failure' && !isSubmitting) {
    return (
      <div className="order-page order-page--result">
        <div className="order-result order-result--failure">
          <div className="order-result__icon" aria-hidden="true">
            !
          </div>
          <h1 className="order-result__title">주문에 실패했습니다</h1>
          <p className="order-result__message">
            {orderFailureMessage || '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'}
          </p>
          <div className="order-result__actions order-result__actions--dual">
            <button
              type="button"
              className="order-result__secondary"
              onClick={() => {
                setOrderStatus('form');
                setNotice({ type: '', message: '' });
                setOrderFailureMessage('');
              }}
            >
              다시 시도하기
            </button>
            <button type="button" className="order-result__primary" onClick={() => onBackToCart()}>
              장바구니로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <header className="order-page__header">
        <button type="button" onClick={onBackToCart} className="order-page__back">
          {directOrderItem ? '← 상품 상세로 돌아가기' : '← 장바구니로 돌아가기'}
        </button>
        <h1>주문하기</h1>
      </header>

      {notice.message && (
        <div className={`order-page__notice order-page__notice--${notice.type || 'info'}`}>
          {notice.message}
        </div>
      )}

      {status === 'loading' && <p className="order-page__status">주문 정보를 불러오는 중입니다...</p>}
      {status === 'error' && (
        <div className="order-page__status order-page__status--error">
          <p>{error}</p>
          <button type="button" onClick={onBackToCart}>
            장바구니로 이동
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="order-page__layout">
          <section className="order-form">
            <h2>Delivery Information</h2>
            <div className="order-form__grid">
              <label>
                Name
                <input type="text" value={formData.name} onChange={handleInputChange('name')} placeholder="받는 분 이름" />
              </label>
              <label>
                Mobile Number
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="+82 10-1234-5678"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="이메일을 입력해주세요"
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  placeholder="도시"
                />
              </label>
              <label>
                State
                <input
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange('state')}
                  placeholder="시/도"
                />
              </label>
              <label>
                ZIP
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={handleInputChange('postalCode')}
                  placeholder="우편번호"
                />
              </label>
              <label>
                Address
                <input
                  type="text"
                  value={formData.address1}
                  onChange={handleInputChange('address1')}
                  placeholder="도로명 주소"
                />
              </label>
              <label>
                상세 주소
                <input
                  type="text"
                  value={formData.address2}
                  onChange={handleInputChange('address2')}
                  placeholder="동/호수 등 상세 주소"
                />
              </label>
            </div>

            <div className="order-form__section order-form__section--logistics">
              <div className="order-form__options-row">
                <div className="order-form__option-card">
                  <div className="order-form__option-header">
                    <h3>Schedule Delivery</h3>
                    <button
                      type="button"
                      className={`order-form__toggle ${formData.scheduleEnabled ? 'is-active' : ''}`}
                      onClick={handleToggleSchedule}
                      aria-pressed={formData.scheduleEnabled}
                    >
                      <span />
                    </button>
                  </div>
                  <p className="order-form__schedule-description">
                    코로라의 기본 배송은 주문 확정 후 평균 3~5일이 소요됩니다. 배송 일정을 활성화하면 예상 수령
                    기간을 기준으로 안내해 드려요.
                  </p>
                  {formData.scheduleEnabled ? (
                    <p className="order-form__estimate">
                      예상 도착&nbsp;<strong>{estimatedWindow}</strong>
                      <span> (주문 확정 후 평균 3~5일)</span>
                    </p>
                  ) : (
                    <p className="order-form__estimate order-form__estimate--muted">
                      예약 배송을 비활성화했습니다. 기본 배송 일정으로 진행돼요.
                    </p>
                  )}
                  <label className="order-form__notes">
                    Note
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={handleInputChange('notes')}
                      placeholder="배송 시 요청 사항이 있다면 입력해주세요"
                    />
                  </label>
                </div>
                <div className="order-form__option-card">
                  <div className="order-form__option-header order-form__option-header--simple">
                    <h3>Payment Method</h3>
                  </div>
                  <div className="order-form__payments order-form__payments--stack">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.value}
                        className={`order-form__payment-option ${
                          formData.paymentMethod === method.value ? 'is-selected' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={formData.paymentMethod === method.value}
                          onChange={() => handleChangePaymentMethod(method.value)}
                        />
                        <div>
                          <strong>{method.label}</strong>
                          <span>{method.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            {renderOrderSummary()}
          </aside>
        </div>
      )}
    </div>
  );
}

export default OrderPage;


