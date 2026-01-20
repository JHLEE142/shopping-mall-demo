import './MonochromePage.css';

function KakaoSupportPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">카카오톡 상담</h1>
          <p className="mono-subtitle">실시간 상담 채널로 연결됩니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">상담 안내</h2>
          <p>운영 시간: 평일 10:00 ~ 16:00 (점심 12:00 ~ 14:00)</p>
          <div className="mono-actions">
            <button type="button" className="mono-button">
              카카오톡 상담 열기
            </button>
            <button type="button" className="mono-button mono-button--ghost">
              상담 가능 시간 확인
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default KakaoSupportPage;
