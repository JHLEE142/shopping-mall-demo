import './MonochromePage.css';

const COUPONS = [
  { id: 'coupon-1', title: '무료 배송 쿠폰', desc: '주문 금액 제한 없이 적용 가능' },
  { id: 'coupon-2', title: '10% 할인 쿠폰', desc: '3만원 이상 주문 시 적용' },
];

function CouponPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">쿠폰 관리</h1>
          <p className="mono-subtitle">보유한 쿠폰을 확인하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">내 쿠폰</h2>
          <div className="mono-grid">
            {COUPONS.map((coupon) => (
              <article key={coupon.id} className="mono-card">
                <strong>{coupon.title}</strong>
                <span className="mono-muted">{coupon.desc}</span>
                <button type="button" className="mono-button mono-button--ghost">
                  적용 조건 보기
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CouponPage;
