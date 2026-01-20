import './MonochromePage.css';

function TermsPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">이용약관</h1>
          <p className="mono-subtitle">서비스 이용에 필요한 약관을 확인하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">주요 내용</h2>
          <ul className="mono-list">
            <li className="mono-list__item">회원 가입 및 서비스 이용 조건</li>
            <li className="mono-list__item">구매 및 결제, 환불 정책</li>
            <li className="mono-list__item">개인정보 보호 및 책임 한계</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default TermsPage;
