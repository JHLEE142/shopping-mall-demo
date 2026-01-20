import './MonochromePage.css';

function NewArrivalsPage({ onBack }) {
  const highlights = [
    { title: '이번 주 신상품', desc: '가장 최근 등록된 상품들을 모아봤어요.' },
    { title: '인기 상승 아이템', desc: '최근 조회수가 빠르게 오른 상품을 확인하세요.' },
    { title: '에디터 추천', desc: '큐레이션된 프리미엄 상품을 소개합니다.' },
  ];

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">New</h1>
          <p className="mono-subtitle">새롭게 추가된 상품과 컬렉션을 확인하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">하이라이트</h2>
          <div className="mono-grid">
            {highlights.map((item) => (
              <article key={item.title} className="mono-card">
                <span className="mono-tag">NEW</span>
                <strong>{item.title}</strong>
                <span className="mono-muted">{item.desc}</span>
                <button type="button" className="mono-button mono-button--ghost">
                  자세히 보기
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NewArrivalsPage;
