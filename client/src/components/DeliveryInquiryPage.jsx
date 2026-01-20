import './MonochromePage.css';

function DeliveryInquiryPage({ onBack, isLoggedIn = false }) {
  const handleSubmit = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    alert('문의가 접수되었습니다.');
  };

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">배송 문의</h1>
          <p className="mono-subtitle">배송 관련 문의를 남기실 수 있습니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">문의 작성</h2>
          <div className="mono-list">
            <div>
              <label className="mono-muted">주문 번호</label>
              <input className="mono-input" type="text" placeholder="예: ORD-2026-001" />
            </div>
            <div>
              <label className="mono-muted">문의 내용</label>
              <textarea className="mono-textarea" placeholder="배송 지연, 주소 변경 등 내용을 적어주세요." />
            </div>
            <div className="mono-actions">
              <button type="button" className="mono-button" onClick={handleSubmit}>
                문의 접수
              </button>
              <button type="button" className="mono-button mono-button--ghost">
                문의 이력 보기
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DeliveryInquiryPage;
