import { useEffect, useState } from 'react';
import { createOrder as createOrderApi } from '../services/orderService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500';

function PaymentSuccessPage({ 
  onBackToHome = () => {},
  onViewOrder = () => {},
  user = null,
}) {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
      setStatus('error');
      return;
    }

    setPaymentData({ paymentKey, orderId, amount: Number(amount) });
    confirmPayment(paymentKey, orderId, Number(amount));
  }, []);

  const confirmPayment = async (paymentKey, orderId, amount) => {
    try {
      // 서버에 결제 승인 요청
      const response = await fetch(`${API_BASE_URL}/api/toss-payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '결제 승인에 실패했습니다.');
      }

      // 결제 승인 성공 후 주문 생성
      const pendingOrderData = sessionStorage.getItem('pendingOrder');
      if (pendingOrderData) {
        try {
          const orderInfo = JSON.parse(pendingOrderData);
          const { cart, formData, subtotal, shippingFee, total, couponDiscount, selectedCoupon, directOrderItem } = orderInfo;

          // 주문 생성
          const orderPayload = {
            items: (cart?.items || []).map((item) => ({
              product: item.product?._id || item.product?.id,
              quantity: item.quantity,
              priceSnapshot: item.priceSnapshot || (item.product?.priceSale || item.product?.price),
              options: item.options || {},
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
              method: 'online',
              transactionId: paymentKey,
              amount: total || amount,
              status: 'paid',
            },
            coupon: selectedCoupon || null,
          };

          const createdOrder = await createOrderApi(orderPayload);
          setOrder(createdOrder.order || createdOrder);
          sessionStorage.removeItem('pendingOrder');
        } catch (e) {
          console.error('주문 생성 오류:', e);
          // 주문 생성 실패해도 결제는 완료되었으므로 성공으로 표시
          setError('결제는 완료되었지만 주문 생성 중 오류가 발생했습니다. 고객센터로 문의해주세요.');
        }
      }
      setStatus('success');
    } catch (err) {
      console.error('결제 승인 오류:', err);
      setError(err.message || '결제 승인 중 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  const createOrderFromPayment = async (paymentInfo, cart, form) => {
    try {
      const discountTotal = cart.items.reduce((sum, item) => {
        const regularPrice = Number(item.product?.price ?? item.priceSnapshot);
        const discount = Math.max(regularPrice - item.priceSnapshot, 0);
        return sum + discount * item.quantity;
      }, 0);

      const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.priceSnapshot, 0);
      const shippingFee = subtotal >= 20000 ? 0 : 3000;
      const grandTotal = subtotal - discountTotal + shippingFee;

      const orderPayload = {
        items: cart.items.map((item) => ({
          product: item.product._id || item.product.id,
          name: item.product.name,
          sku: item.product.sku || '',
          thumbnail: item.product.image || item.product.thumbnail || '',
          options: item.options || {},
          quantity: item.quantity,
          unitPrice: item.priceSnapshot || (item.product.priceSale || item.product.price),
          lineDiscount: Math.max(Number(item.product?.price ?? 0) - (item.priceSnapshot || (item.product.priceSale || item.product.price)), 0),
          lineTotal: (item.priceSnapshot || (item.product.priceSale || item.product.price)) * item.quantity,
        })),
        summary: {
          currency: 'KRW',
          subtotal,
          discountTotal,
          shippingFee,
          grandTotal,
        },
        payment: {
          method: paymentInfo.method || 'card',
          status: 'paid',
          amount: paymentInfo.amount,
          currency: 'KRW',
          transactionId: paymentInfo.paymentKey,
          receiptUrl: paymentInfo.receipt?.url,
          paidAt: paymentInfo.approvedAt ? new Date(paymentInfo.approvedAt).toISOString() : new Date().toISOString(),
        },
        shipping: {
          address: {
            name: form.name,
            phone: form.phone,
            postalCode: form.postalCode,
            address1: form.address1,
            address2: form.address2,
          },
          request: form.notes,
        },
        notes: form.notes,
        contact: {
          phone: form.phone,
          email: form.email,
        },
        guestName: form.name,
        guestEmail: form.email,
        sourceCart: cart._id,
      };

      const createdOrder = await createOrderApi(orderPayload);
      setOrder(createdOrder);
      setStatus('success');
    } catch (err) {
      console.error('주문 생성 오류:', err);
      setError(err.message || '주문 생성 중 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="payment-success-page">
        <div className="payment-success-page__loading">
          <div className="loading-spinner"></div>
          <h2>결제 승인 중...</h2>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="payment-success-page">
        <div className="payment-success-page__error">
          <h2>결제 처리 중 오류가 발생했습니다</h2>
          <p>{error}</p>
          <div className="button-group">
            <button onClick={onBackToHome}>홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <div className="payment-success-page__success">
        <div className="success-icon">✓</div>
        <h2>결제를 완료했어요</h2>
        {paymentData && (
          <div className="payment-info">
            <div className="info-row">
              <span className="info-label">결제 금액</span>
              <span className="info-value">{paymentData.amount.toLocaleString()}원</span>
            </div>
            <div className="info-row">
              <span className="info-label">주문번호</span>
              <span className="info-value">{paymentData.orderId}</span>
            </div>
            {paymentData.paymentKey && (
              <div className="info-row">
                <span className="info-label">결제키</span>
                <span className="info-value">{paymentData.paymentKey}</span>
              </div>
            )}
          </div>
        )}
        <div className="button-group">
          {order && (
            <button className="btn-primary" onClick={() => onViewOrder(order)}>
              주문 상세보기
            </button>
          )}
          <button onClick={onBackToHome}>홈으로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;

