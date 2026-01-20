import './MonochromePage.css';

function NotificationCenterPage({ onBack }) {
  const notifications = [];

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">알림 센터</h1>
          <p className="mono-subtitle">주문, 배송, 프로모션 알림을 확인하세요.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">최근 알림</h2>
          {notifications.length === 0 ? (
            <p className="mono-muted">새로운 알림이 없습니다.</p>
          ) : (
            <ul className="mono-list">
              {notifications.map((item) => (
                <li key={item.id} className="mono-list__item">
                  {item.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default NotificationCenterPage;
