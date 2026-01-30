import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

const TOSS_CLIENT_KEY = process.env.VITE_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

function TossPaymentWidget({
  amount,
  orderName,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onBeforePayment,
  disabled = false,
}) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentMethodWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);
  const tossPaymentsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initTossPayments() {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        if (!isMounted) return;

        tossPaymentsRef.current = tossPayments;
        const widgets = tossPayments.widgets({
          customerKey: ANONYMOUS,
        });

        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        // 결제 수단 위젯 렌더링
        const [paymentMethodWidget] = await Promise.all([
          widgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          }),
          widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          }),
        ]);

        if (!isMounted) return;

        paymentMethodWidgetRef.current = paymentMethodWidget;

        // 결제 수단 선택 이벤트
        paymentMethodWidget.on('paymentMethodSelect', (selectedPaymentMethod) => {
          console.log('selectedPaymentMethod: ', selectedPaymentMethod);
        });

        setIsReady(true);
      } catch (error) {
        console.error('토스페이먼츠 초기화 실패:', error);
        if (isMounted) {
          onPaymentError?.(error);
        }
      }
    }

    initTossPayments();

    return () => {
      isMounted = false;
    };
  }, [amount, onPaymentError]);

  const generateOrderId = () => {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePaymentRequest = async () => {
    if (!isReady || isLoading || disabled) return;

    try {
      setIsLoading(true);

      // 결제 전 콜백 실행 (주문 정보 저장 등)
      if (onBeforePayment) {
        onBeforePayment();
      }

      const orderId = generateOrderId();
      const selectedPaymentMethod = await paymentMethodWidgetRef.current?.getSelectedPaymentMethod();
      
      console.log('selectedPaymentMethod: ', selectedPaymentMethod);

      const widgets = tossPaymentsRef.current.widgets({
        customerKey: ANONYMOUS,
      });

      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}?view=payment-success&orderId=${orderId}&amount=${amount}`,
        failUrl: `${window.location.origin}?view=payment-fail&orderId=${orderId}`,
        customerEmail: customerEmail || 'customer@example.com',
        customerName: customerName || '고객',
        customerMobilePhone: customerPhone || '01012345678',
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
      setIsLoading(false);
      onPaymentError?.(error);
    }
  };

  return (
    <div className="toss-payment-widget">
      <div id="payment-method" className="payment-method-container"></div>
      <div id="agreement" className="agreement-container"></div>
      <button
        id="payment-request-button"
        type="button"
        className="payment-request-button"
        onClick={handlePaymentRequest}
        disabled={!isReady || isLoading || disabled}
      >
        {isLoading ? '결제 처리 중...' : '결제하기'}
      </button>
    </div>
  );
}

export default TossPaymentWidget;

