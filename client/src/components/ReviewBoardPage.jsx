import './MonochromePage.css';

const REVIEWS = [
  { title: '배송이 빨라요', author: '고객 A', summary: '포장이 꼼꼼했고 기대보다 빨리 도착했어요.' },
  { title: '디자인이 만족', author: '고객 B', summary: '심플해서 어디에나 잘 어울립니다.' },
  { title: '재구매 의사 있음', author: '고객 C', summary: '가격 대비 품질이 좋아요.' },
];

function ReviewBoardPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">구매 후기</h1>
          <p className="mono-subtitle">실제 구매 고객의 리뷰를 모아봤어요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">베스트 리뷰</h2>
          <div className="mono-grid">
            {REVIEWS.map((review) => (
              <article key={review.title} className="mono-card">
                <strong>{review.title}</strong>
                <span className="mono-muted">{review.summary}</span>
                <span className="mono-muted">작성자: {review.author}</span>
                <button type="button" className="mono-button mono-button--ghost">
                  리뷰 상세
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReviewBoardPage;
