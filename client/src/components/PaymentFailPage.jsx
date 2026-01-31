function PaymentFailPage({ onBackToHome = () => {} }) {
  // 결제 실패 시 민감한 정보(에러코드, 주문번호 등)는 URL 파라미터에서 읽지 않음
  // 사용자에게는 일반적인 안내 메시지만 표시

  return (
    <div className="payment-fail-page">
      <div className="payment-fail-page__content">
        <div className="error-icon" style={{ fontSize: '4rem', color: '#dc2626', marginBottom: '1rem' }}>✗</div>
        <h2 style={{ marginBottom: '1rem' }}>결제를 실패했어요</h2>
        <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1rem' }}>
          결제 처리 중 오류가 발생했습니다. 다시 시도해주시거나 고객센터로 문의해주세요.
        </p>
        <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={onBackToHome}
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
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailPage;

