import './MonochromePage.css';

function PaymentCancelPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">입금/결제/취소</h1>
          <p className="mono-subtitle">결제와 취소 관련 안내를 확인하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">자주 묻는 안내</h2>
          <ul className="mono-list">
            <li className="mono-list__item">입금 확인은 영업일 기준 최대 1일 소요됩니다.</li>
            <li className="mono-list__item">주문 취소는 마이페이지 &gt; 주문 내역에서 가능합니다.</li>
            <li className="mono-list__item">결제 오류가 발생하면 고객센터로 문의해주세요.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
