import './MonochromePage.css';

function MarketingPolicyPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">마케팅 수신 동의</h1>
          <p className="mono-subtitle">프로모션 정보 수신 여부를 안내합니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">안내</h2>
          <ul className="mono-list">
            <li className="mono-list__item">이벤트 및 할인 정보를 이메일/문자로 안내합니다.</li>
            <li className="mono-list__item">동의는 언제든지 철회할 수 있습니다.</li>
            <li className="mono-list__item">동의하지 않아도 서비스 이용에는 제한이 없습니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default MarketingPolicyPage;
