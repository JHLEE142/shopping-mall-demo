import './MonochromePage.css';

function PrivacyPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">개인정보처리방침</h1>
          <p className="mono-subtitle">수집/이용/보관 범위를 안내합니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">핵심 요약</h2>
          <ul className="mono-list">
            <li className="mono-list__item">주문 및 배송 처리를 위한 최소 정보만 수집합니다.</li>
            <li className="mono-list__item">보관 기간 경과 시 지체 없이 파기합니다.</li>
            <li className="mono-list__item">외부 제공 시 사전 동의를 받습니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
