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

          // 서버가 요구하는 형식으로 items 변환
          const items = (cart?.items || []).map((item) => {
            const product = item.product || {};
            const unitPrice = item.priceSnapshot || product.priceSale || product.price || 0;
            const quantity = item.quantity || 1;
            const regularPrice = product.price || unitPrice;
            const lineDiscount = Math.max(regularPrice - unitPrice, 0) * quantity;
            const lineTotal = unitPrice * quantity;

            return {
              product: product._id || product.id,
              name: product.name || '상품명 없음',
              sku: product.sku || product.code || '',
              thumbnail: product.image || product.thumbnail || '',
              options: item.options || {},
              quantity: quantity,
              unitPrice: unitPrice,
              lineDiscount: lineDiscount,
              lineTotal: lineTotal,
            };
          });

          // summary 계산
          const finalSubtotal = subtotal || items.reduce((sum, item) => sum + item.lineTotal, 0);
          const finalShippingFee = shippingFee || 0;
          const finalCouponDiscount = couponDiscount || 0;
          const grandTotal = total || (finalSubtotal - finalCouponDiscount + finalShippingFee);

          // 주문 생성
          const orderPayload = {
            items: items,
            summary: {
              currency: 'KRW',
              subtotal: finalSubtotal,
              discountTotal: finalCouponDiscount,
              shippingFee: finalShippingFee,
              grandTotal: grandTotal,
            },
            shipping: {
              address: {
                name: formData.name || '',
                phone: formData.phone || '',
                postalCode: formData.postalCode || '',
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                city: formData.city || '',
                state: formData.state || '',
              },
              request: formData.notes || '',
            },
            contact: {
              phone: formData.phone || '',
              email: formData.email || '',
            },
            guestName: formData.name || '',
            guestEmail: formData.email || '',
            notes: formData.notes || '',
            payment: {
              method: 'online',
              transactionId: paymentKey,
              amount: grandTotal,
              status: 'paid',
            },
            coupon: selectedCoupon ? { userCouponId: selectedCoupon } : null,
            sourceCart: cart?._id || null,
          };

          console.log('주문 생성 시작:', JSON.stringify(orderPayload, null, 2));
          const createdOrder = await createOrderApi(orderPayload);
          console.log('주문 생성 성공:', createdOrder);
          
          setOrder(createdOrder.order || createdOrder);
          sessionStorage.removeItem('pendingOrder');
          setStatus('success'); // 주문 생성 성공 시에만 success 상태로 변경
        } catch (e) {
          console.error('주문 생성 오류:', e);
          console.error('주문 생성 오류 상세:', {
            message: e.message,
            status: e.status,
            data: e.data,
            stack: e.stack,
          });
          // 주문 생성 실패 시 에러 상태로 유지
          const errorMessage = e.data?.message || e.message || '알 수 없는 오류';
          setError(`주문 생성 중 오류가 발생했습니다: ${errorMessage}. 결제는 완료되었으니 고객센터로 문의해주세요. (결제키: ${paymentKey})`);
          setStatus('error');
          return; // 에러 상태로 유지하고 함수 종료
        }
      } else {
        // pendingOrder가 없는 경우 (세션이 끊겼거나 직접 접근한 경우)
        console.warn('pendingOrder 데이터가 없습니다. 주문 정보를 찾을 수 없습니다.');
        setError('주문 정보를 찾을 수 없습니다. 결제는 완료되었으니 고객센터로 문의해주세요.');
        setStatus('error');
        return;
      }
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
        {order ? (
          <>
            <p style={{ marginTop: '1rem', color: '#059669', fontWeight: 'bold' }}>
              주문이 성공적으로 생성되었습니다!
            </p>
            <div className="payment-info" style={{ marginTop: '1.5rem' }}>
              <div className="info-row">
                <span className="info-label">주문번호</span>
                <span className="info-value">{order.orderNumber || order._id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">결제 금액</span>
                <span className="info-value">{paymentData?.amount.toLocaleString() || order.summary?.grandTotal?.toLocaleString() || '0'}원</span>
              </div>
              {paymentData?.paymentKey && (
                <div className="info-row">
                  <span className="info-label">결제키</span>
                  <span className="info-value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{paymentData.paymentKey}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          paymentData && (
            <div className="payment-info" style={{ marginTop: '1.5rem' }}>
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
                  <span className="info-value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{paymentData.paymentKey}</span>
                </div>
              )}
              <p style={{ marginTop: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
                ⚠️ 주문 정보를 찾을 수 없습니다. 고객센터로 문의해주세요.
              </p>
            </div>
          )
        )}
        <div className="button-group" style={{ marginTop: '2rem' }}>
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

