import './MonochromePage.css';

const TOPUP_OPTIONS = [10000, 30000, 50000, 100000];

function MoneyTopupPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">머니 충전</h1>
          <p className="mono-subtitle">원하는 금액을 선택해 충전하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">충전 금액</h2>
          <div className="mono-grid">
            {TOPUP_OPTIONS.map((amount) => (
              <div key={amount} className="mono-card">
                <strong>{amount.toLocaleString()}원</strong>
                <button type="button" className="mono-button">
                  충전하기
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MoneyTopupPage;
