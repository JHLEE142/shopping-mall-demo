import { useEffect, useMemo, useState } from 'react';
import { fetchCart } from '../services/cartService';
import { createOrder as createOrderApi } from '../services/orderService';

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
  portOneImpKey = 'imp65366328', // PortOne 가맹점 식별코드
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
  const [isImpReady, setIsImpReady] = useState(false);
  const [orderStatus, setOrderStatus] = useState('form'); // form | success | failure
  const [orderResult, setOrderResult] = useState(null);
  const [orderFailureMessage, setOrderFailureMessage] = useState('');

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { IMP } = window;

    if (!IMP || typeof IMP.init !== 'function') {
      console.warn('PortOne SDK(IMP)이 로드되지 않았습니다.');
      return;
    }

    IMP.init(portOneImpKey);
    setIsImpReady(true);
  }, [portOneImpKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      try {
        setStatus('loading');
        const data = await fetchCart();
        if (!isMounted) return;
        setCart(data.cart);
        setStatus('success');
        onCartUpdate(data.cart?.items?.length ?? 0);
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
  }, [onCartUpdate]);

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) {
      return 0;
    }
    return cart.items.reduce((sum, item) => sum + item.quantity * item.priceSnapshot, 0);
  }, [cart]);

  const shippingFee = subtotal >= 100000 || !cart?.items?.length ? 0 : 3000;
  const total = subtotal + shippingFee;
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

  const handleConfirmOrder = () => {
    if (orderStatus !== 'form') {
      return;
    }

    if (!isImpReady) {
      setNotice({
        type: 'error',
        message: '결제 모듈 초기화 중입니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    if (!cart?.items?.length) {
      setNotice({ type: 'error', message: '장바구니가 비어 있어 주문을 진행할 수 없습니다.' });
      return;
    }

    const { IMP } = window;

    if (!IMP || typeof IMP.request_pay !== 'function') {
      setNotice({
        type: 'error',
        message: '결제 모듈을 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    setOrderFailureMessage('');
    setNotice({ type: 'info', message: '결제 창을 여는 중입니다...' });

    const orderTitle =
      cart.items.length === 1
        ? cart.items[0].product.name
        : `주문 (${cart.items.length}건)`;

    const amount = Number(total || 0);
    const amountToCharge = amount > 0 ? amount : 1;

    IMP.request_pay(
      {
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: `order_${Date.now()}`,
        name: orderTitle,
        amount: amountToCharge,
        buyer_email: formData.email,
        buyer_name: formData.name,
        buyer_tel: formData.phone,
        buyer_addr: `${formData.address1} ${formData.address2}`.trim(),
        buyer_postcode: formData.postalCode,
        custom_data: {
          cartId: cart._id ?? null,
          items: cart.items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
          })),
        },
      },
      async (response) => {
        if (response.success) {
          setNotice({
            type: 'info',
            message: '결제를 확인하고 주문을 생성하고 있습니다...',
          });

          const discountTotal = cart.items.reduce((sum, item) => {
            const regularPrice = Number(item.product?.price ?? item.priceSnapshot);
            const discount = Math.max(regularPrice - item.priceSnapshot, 0);
            return sum + discount * item.quantity;
          }, 0);

          const orderPayload = {
            items: cart.items.map((item) => ({
              product: item.product._id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnail: item.product.image,
              options: convertSelectedOptions(item.selectedOptions),
              quantity: item.quantity,
              unitPrice: item.priceSnapshot,
              lineDiscount: Math.max(Number(item.product?.price ?? 0) - item.priceSnapshot, 0),
              lineTotal: item.priceSnapshot * item.quantity,
            })),
            summary: {
              currency: currencyCode || 'KRW',
              subtotal,
              discountTotal,
              shippingFee,
              grandTotal: amountToCharge,
            },
            payment: {
              method: 'card',
              status: 'paid',
              amount: amountToCharge,
              currency: currencyCode || 'KRW',
              transactionId: response.imp_uid,
              receiptUrl: response.receipt_url,
              paidAt: response.paid_at
                ? new Date(response.paid_at * 1000).toISOString()
                : new Date().toISOString(),
            },
            paymentVerification: {
              impUid: response.imp_uid,
            },
            shipping: {
              address: {
                name: formData.name,
                phone: formData.phone,
                postalCode: formData.postalCode,
                address1: formData.address1,
                address2: formData.address2,
              },
              request: formData.notes,
            },
            notes: formData.notes,
            contact: {
              phone: formData.phone,
              email: formData.email,
            },
            guestName: formData.name,
            guestEmail: formData.email,
            sourceCart: cart._id,
          };

          try {
            const createdOrder = await createOrderApi(orderPayload);
            setOrderResult(createdOrder);
            setOrderStatus('success');
            setNotice({
              type: 'success',
              message: '주문이 완료되었습니다!',
            });
            onCartUpdate(0);
          } catch (orderError) {
            const message = orderError.message || '주문을 생성하지 못했습니다.';
            setOrderFailureMessage(message);
            setOrderStatus('failure');
            setNotice({
              type: 'error',
              message,
            });
          } finally {
            setIsSubmitting(false);
          }
        } else {
          const message = response.error_msg || '결제가 취소되었거나 실패했습니다.';
          setNotice({
            type: 'error',
            message,
          });
          setOrderFailureMessage(message);
          setOrderStatus('failure');
          setIsSubmitting(false);
        }
      }
    );
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
          {cart.items.map((item) => (
            <li key={item.product._id} className="order-summary__item">
              <div className="order-summary__item-thumb">
                <img src={item.product.image} alt={item.product.name} />
              </div>
              <div className="order-summary__item-info">
                <strong>{item.product.name}</strong>
                <span>{item.product.sku}</span>
                <div>
                  수량 {item.quantity} ·{' '}
                  {formatCurrency(item.priceSnapshot * item.quantity, currencyCode)}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <dl className="order-summary__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal, currencyCode)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shippingFee === 0 ? '무료' : formatCurrency(shippingFee, currencyCode)}</dd>
          </div>
          <div className="order-summary__grand">
            <dt>Total</dt>
            <dd>{formatCurrency(total, currencyCode)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="order-summary__confirm"
          onClick={handleConfirmOrder}
          disabled={isSubmitting || orderStatus !== 'form'}
        >
          {isSubmitting ? '처리 중...' : 'Confirm Order'}
        </button>
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
          ← 장바구니로 돌아가기
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
                    기본 배송은 주문 확정 후 평균 3~5일이 소요됩니다. 배송 일정을 활성화하면 예상 수령
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

