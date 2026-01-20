import './MonochromePage.css';

function PasswordResetPage({ onBack }) {
  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">비밀번호 찾기</h1>
          <p className="mono-subtitle">가입한 이메일로 재설정 링크를 보내드립니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">재설정 요청</h2>
          <div className="mono-list">
            <input className="mono-input" type="email" placeholder="이메일 주소 입력" />
            <div className="mono-actions">
              <button type="button" className="mono-button">
                링크 발송
              </button>
              <button type="button" className="mono-button mono-button--ghost" onClick={onBack}>
                취소
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PasswordResetPage;
