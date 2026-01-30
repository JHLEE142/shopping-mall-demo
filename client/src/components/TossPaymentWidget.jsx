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
        // DOM 요소가 준비될 때까지 대기
        const checkDOMReady = () => {
          const paymentMethodEl = document.getElementById('payment-method');
          const agreementEl = document.getElementById('agreement');
          return paymentMethodEl && agreementEl;
        };

        // DOM 요소가 준비될 때까지 최대 5초 대기
        let attempts = 0;
        const maxAttempts = 50; // 5초 (100ms * 50)
        while (!checkDOMReady() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!checkDOMReady()) {
          console.warn('토스페이먼츠 DOM 요소를 찾을 수 없습니다.');
          if (isMounted) {
            setIsReady(true); // DOM 요소가 없어도 버튼은 활성화 (fallback)
          }
          return;
        }

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
          // 초기화 실패해도 버튼은 활성화 (사용자가 재시도할 수 있도록)
          setIsReady(true);
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
        disabled={(() => {
          const btnDisabled = !isReady || isLoading || disabled;
          if (btnDisabled && process.env.NODE_ENV === 'development') {
            console.log('결제 버튼 비활성화 상태:', {
              isReady,
              isLoading,
              disabled,
              reason: !isReady ? '위젯 초기화 대기 중' : isLoading ? '결제 처리 중' : disabled ? '외부에서 비활성화됨' : '알 수 없음',
            });
          }
          return btnDisabled;
        })()}
        title={!isReady ? '결제 위젯 로딩 중...' : isLoading ? '결제 처리 중...' : disabled ? '결제 조건을 확인해주세요' : '결제하기'}
      >
        {isLoading ? '결제 처리 중...' : !isReady ? '결제 위젯 로딩 중...' : '결제하기'}
      </button>
    </div>
  );
}

export default TossPaymentWidget;

