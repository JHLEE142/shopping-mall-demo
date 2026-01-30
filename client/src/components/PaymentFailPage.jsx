function PaymentFailPage({ onBackToHome = () => {} }) {
  const urlParams = new URLSearchParams(window.location.search);
  const errorCode = urlParams.get('code');
  const errorMessage = urlParams.get('message');
  const orderId = urlParams.get('orderId');

  // 사용자 친화적인 에러 메시지 변환
  const getFriendlyErrorMessage = (code, message) => {
    if (message) {
      // 토스페이먼츠 에러 메시지가 한글이면 그대로 사용
      if (/[가-힣]/.test(message)) {
        return message;
      }
    }

    // 에러 코드에 따른 메시지
    switch (code) {
      case 'USER_CANCEL':
        return '결제가 취소되었습니다.';
      case 'INVALID_CARD':
        return '유효하지 않은 카드 정보입니다.';
      case 'INSUFFICIENT_FUNDS':
        return '잔액이 부족합니다.';
      case 'CARD_EXPIRED':
        return '카드 유효기간이 만료되었습니다.';
      case 'PAYMENT_FAILED':
        return '결제 처리에 실패했습니다.';
      default:
        return message || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  const friendlyMessage = getFriendlyErrorMessage(errorCode, errorMessage);

  return (
    <div className="payment-fail-page">
      <div className="payment-fail-page__content">
        <div className="error-icon" style={{ fontSize: '4rem', color: '#dc2626', marginBottom: '1rem' }}>✗</div>
        <h2 style={{ marginBottom: '1rem' }}>결제를 실패했어요</h2>
        <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1rem' }}>
          {friendlyMessage}
        </p>
        {(errorCode || errorMessage) && (
          <div className="error-info" style={{ 
            marginBottom: '2rem', 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            {errorCode && (
              <div className="info-row" style={{ marginBottom: '0.5rem' }}>
                <span className="info-label" style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>에러 코드:</span>
                <span className="info-value">{errorCode}</span>
              </div>
            )}
            {errorMessage && errorMessage !== friendlyMessage && (
              <div className="info-row">
                <span className="info-label" style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>상세 메시지:</span>
                <span className="info-value" style={{ wordBreak: 'break-word' }}>{errorMessage}</span>
              </div>
            )}
            {orderId && (
              <div className="info-row" style={{ marginTop: '0.5rem' }}>
                <span className="info-label" style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>주문번호:</span>
                <span className="info-value">{orderId}</span>
              </div>
            )}
          </div>
        )}
        <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={() => {
              // 주문 페이지로 돌아가기 (orderId가 있으면)
              if (orderId) {
                window.location.href = `?view=order&orderId=${orderId}`;
              } else {
                onBackToHome();
              }
            }}
            style={{ 
              padding: '0.75rem 2rem', 
              fontSize: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {orderId ? '주문 페이지로 돌아가기' : '홈으로 돌아가기'}
          </button>
          <button 
            onClick={onBackToHome}
            style={{ 
              padding: '0.75rem 2rem', 
              fontSize: '1rem',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailPage;

