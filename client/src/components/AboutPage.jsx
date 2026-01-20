import './MonochromePage.css';

function AboutPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">About</h1>
          <p className="mono-subtitle">브랜드가 추구하는 가치와 비전을 소개합니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">브랜드 스토리</h2>
          <p>
            우리는 심플함 속에서 가장 중요한 경험을 찾아냅니다. 제품의 기능과 디자인 모두를
            흑백의 균형처럼 깔끔하게 정리하여 고객의 일상을 더 선명하게 만듭니다.
          </p>
          <div className="mono-divider" />
          <div className="mono-list">
            <div className="mono-list__item">정직한 품질, 투명한 가격</div>
            <div className="mono-list__item">필요한 정보만 제공하는 간결한 경험</div>
            <div className="mono-list__item">지속 가능한 공급과 책임 있는 배송</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
