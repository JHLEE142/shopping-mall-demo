function PaymentFailPage({ onBackToHome = () => {} }) {
  const urlParams = new URLSearchParams(window.location.search);
  const errorCode = urlParams.get('code');
  const errorMessage = urlParams.get('message');

  return (
    <div className="payment-fail-page">
      <div className="payment-fail-page__content">
        <div className="error-icon">✗</div>
        <h2>결제를 실패했어요</h2>
        {errorCode && (
          <div className="error-info">
            <div className="info-row">
              <span className="info-label">에러 코드</span>
              <span className="info-value">{errorCode}</span>
            </div>
            {errorMessage && (
              <div className="info-row">
                <span className="info-label">에러 메시지</span>
                <span className="info-value">{errorMessage}</span>
              </div>
            )}
          </div>
        )}
        <div className="button-group">
          <button className="btn-primary" onClick={onBackToHome}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailPage;

