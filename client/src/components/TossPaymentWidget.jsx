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
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [hasSelectedPaymentMethod, setHasSelectedPaymentMethod] = useState(false);
  const selectedPaymentMethodRef = useRef(null); // 선택된 결제 수단 저장
  const paymentMethodWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);
  const tossPaymentsRef = useRef(null);
  const widgetsRef = useRef(null); // widgets 인스턴스 저장
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // 이미 초기화되었으면 재초기화하지 않음
    if (isInitializedRef.current) {
      return;
    }

    async function initTossPayments() {
      try {
        // DOM 요소가 준비될 때까지 대기
        const checkDOMReady = () => {
          const paymentMethodEl = document.getElementById('payment-method');
          return paymentMethodEl; // agreement는 제거했으므로 체크하지 않음
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
            isInitializedRef.current = true;
          }
          return;
        }

        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        if (!isMounted) return;

        tossPaymentsRef.current = tossPayments;
        const widgets = tossPayments.widgets({
          customerKey: ANONYMOUS,
        });
        
        // widgets 인스턴스를 ref에 저장하여 재사용
        widgetsRef.current = widgets;

        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        // 결제 수단 위젯만 렌더링 (약관 위젯은 제거하여 중복 에러 방지)
        const paymentMethodWidget = await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        if (!isMounted) return;

        paymentMethodWidgetRef.current = paymentMethodWidget;
        isInitializedRef.current = true;

        // 결제 수단 선택 이벤트
        paymentMethodWidget.on('paymentMethodSelect', (selectedPaymentMethod) => {
          console.log('선택된 결제 수단:', selectedPaymentMethod);
          if (isMounted) {
            selectedPaymentMethodRef.current = selectedPaymentMethod; // ref에 저장
            setHasSelectedPaymentMethod(true);
          }
        });
        
        // 결제 수단 선택 해제 이벤트
        paymentMethodWidget.on('paymentMethodUnselect', () => {
          console.log('결제 수단 선택 해제됨');
          if (isMounted) {
            selectedPaymentMethodRef.current = null; // ref 초기화
            setHasSelectedPaymentMethod(false);
          }
        });

        setIsReady(true);
      } catch (error) {
        console.error('토스페이먼츠 초기화 실패:', error);
        if (isMounted) {
          // 초기화 실패해도 버튼은 활성화 (사용자가 재시도할 수 있도록)
          setIsReady(true);
          isInitializedRef.current = true;
          onPaymentError?.(error);
        }
      }
    }

    initTossPayments();

    return () => {
      isMounted = false;
      // cleanup은 하지 않음 (위젯이 유지되어야 함)
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  const generateOrderId = () => {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePaymentRequest = async () => {
    if (!isReady || isLoading || disabled || !agreementChecked) {
      if (!agreementChecked) {
        alert('결제 서비스 이용 약관에 동의해주세요.');
      }
      return;
    }

    try {
      setIsLoading(true);

      // 결제 전 콜백 실행 (주문 정보 저장 등)
      if (onBeforePayment) {
        onBeforePayment();
      }

      const orderId = generateOrderId();
      
      // 저장된 widgets 인스턴스 사용 (새로 생성하지 않음)
      const widgets = widgetsRef.current;
      if (!widgets) {
        const errorMsg = '결제 위젯이 초기화되지 않았습니다. 페이지를 새로고침해주세요.';
        console.error('●▶결제 요청 실패 :', errorMsg);
        setIsLoading(false);
        const paymentError = new Error(errorMsg);
        onPaymentError?.(paymentError);
        return;
      }

      // 결제 수단이 선택되었는지 확인 (이벤트 기반으로 확인)
      // ref와 state 모두 확인하여 더 안정적으로 처리
      const selectedMethod = selectedPaymentMethodRef.current;
      
      if (!selectedMethod && !hasSelectedPaymentMethod) {
        const errorMsg = '결제 수단을 선택해주세요. 위젯에서 결제 수단을 먼저 선택한 후 결제하기 버튼을 클릭해주세요.';
        console.error('●▶결제 요청 실패 :', errorMsg);
        console.error('●▶결제 에러 :', errorMsg);
        setIsLoading(false);
        const paymentError = new Error(errorMsg);
        onPaymentError?.(paymentError);
        return;
      }

      // 결제 수단이 선택되었음을 확인
      if (selectedMethod) {
        console.log('결제 진행 - 선택된 결제 수단:', selectedMethod);
      } else if (hasSelectedPaymentMethod) {
        console.log('결제 진행 - 결제 수단 선택됨 (state 확인)');
      }

      // 위젯이 결제 수단 선택 상태를 완전히 인식할 수 있도록 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100));

      // 결제 수단이 선택되었을 때만 requestPayment 호출
      // 토스페이먼츠가 paymentKey와 orderId를 자동으로 추가하므로 successUrl에는 view만 포함
      // amount는 sessionStorage에 저장하여 PaymentSuccessPage에서 사용
      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}?view=payment-success`,
        failUrl: `${window.location.origin}?view=payment-fail`,
        customerEmail: customerEmail || 'customer@example.com',
        customerName: customerName || '고객',
        customerMobilePhone: customerPhone || '01012345678',
      });
    } catch (error) {
      console.error('●▶결제 요청 실패 :', error);
      setIsLoading(false);
      
      // 에러 메시지 파싱
      let errorMessage = error?.message || error?.toString() || '결제 처리 중 오류가 발생했습니다.';
      
      // 토스페이먼츠 에러 메시지 처리
      if (errorMessage.includes('결제수단이 아직 선택되지 않았어요') || 
          errorMessage.includes('결제수단을 선택해 주세요') ||
          errorMessage.includes('결제 수단') ||
          errorMessage.includes('payment method') ||
          errorMessage.includes('선택되지 않았어요')) {
        errorMessage = '결제 수단을 선택해주세요. 위젯에서 결제 수단을 먼저 선택한 후 결제하기 버튼을 클릭해주세요.';
      }
      
      // 에러 객체가 아닌 경우 Error 객체로 변환
      const paymentError = error instanceof Error ? error : new Error(errorMessage);
      paymentError.message = errorMessage;
      
      console.error('●▶결제 에러 :', errorMessage);
      onPaymentError?.(paymentError);
    }
  };

  // 금액이 변경되면 위젯 금액 업데이트
  useEffect(() => {
    if (isReady && widgetsRef.current && amount) {
      widgetsRef.current.setAmount({
        currency: 'KRW',
        value: amount,
      }).catch(err => {
        console.warn('금액 업데이트 실패:', err);
      });
    }
  }, [amount, isReady]);

  return (
    <div className="toss-payment-widget">
      <div id="payment-method" className="payment-method-container"></div>
      {/* 약관 위젯 제거 - 직접 체크박스로 대체 */}
      <div className="agreement-container" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={agreementChecked}
            onChange={(e) => setAgreementChecked(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
            [필수] 결제 서비스 이용 약관, 개인정보 처리에 동의합니다.
          </span>
        </label>
      </div>
      <button
        id="payment-request-button"
        type="button"
        className="payment-request-button"
        onClick={handlePaymentRequest}
        disabled={(() => {
          const btnDisabled = !isReady || isLoading || disabled || !agreementChecked;
          if (btnDisabled && process.env.NODE_ENV === 'development') {
            console.log('결제 버튼 비활성화 상태:', {
              isReady,
              isLoading,
              disabled,
              agreementChecked,
              reason: !isReady ? '위젯 초기화 대기 중' : isLoading ? '결제 처리 중' : !agreementChecked ? '약관 동의 필요' : disabled ? '외부에서 비활성화됨' : '알 수 없음',
            });
          }
          return btnDisabled;
        })()}
        title={!isReady ? '결제 위젯 로딩 중...' : isLoading ? '결제 처리 중...' : !agreementChecked ? '약관 동의가 필요합니다' : disabled ? '결제 조건을 확인해주세요' : '결제하기'}
      >
        {isLoading ? '결제 처리 중...' : !isReady ? '결제 위젯 로딩 중...' : '결제하기'}
      </button>
    </div>
  );
}

export default TossPaymentWidget;

